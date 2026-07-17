import { inngest } from "@/lib/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendGmail, hasGmailTokens } from "@/lib/gmail";
import { getResendClient } from "@/lib/resend";
import { logger } from "@/lib/logger";

export const processLateFee = inngest.createFunction(
  { 
    id: "process-late-fee", 
    retries: 3, 
    triggers: [{ event: "invoice.apply_late_fee" }],
    concurrency: {
      limit: 1,
      key: "event.data.invoiceId"
    }
  },
  async ({ event, step }) => {
    const {
      invoiceId,
      policyId,
      adminUserId,
      feeAmount,
      dueDate,
      subject,
      body_html,
      // Set only when this event comes from a human approving a late-fee draft
      // (see app/actions/drafts.ts). Used to re-schedule the next period of a
      // recurring policy, which the draft path can't do on its own.
      fromDraftApproval,
    } = event.data;

    const supabase = createSupabaseAdminClient();

    // 1. Fetch invoice to ensure it still exists and check balance
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*, clients!inner(id, name, email)")
      .eq("id", invoiceId)
      .single();

    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    // 2. Fetch Policy
    const { data: policy } = await supabase
      .from("late_fee_policies")
      .select("*")
      .eq("id", policyId)
      .single();

    if (!policy) throw new Error(`Policy ${policyId} not found`);

    // Check the remaining balance again (invoice total minus payments recorded
    // so far). The invoices row has no amount_paid column, so sum the payments.
    const { data: paidRows } = await supabase
      .from("payments")
      .select("amount")
      .eq("invoice_id", invoiceId);
    const amountPaid = (paidRows || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const balance = Math.max(0, Number(invoice.amount || 0) - amountPaid);
    if (balance <= 0) return { skipped: true, reason: "Zero balance" };

    // Final idempotency gate: late-fee-workflow.ts checks applied_late_fees
    // before firing this event, but it doesn't wait for this function to
    // finish writing that row, so a second evaluate_late_fee run (e.g. from
    // a due-date edit or policy update re-evaluating every open invoice) can
    // pass that stale check and queue a second invoice.apply_late_fee before
    // the first one has recorded itself. concurrency.key (invoiceId) above
    // serializes these two runs, so by the time this one executes, the
    // earlier run (if any) has already completed and inserted its row.
    const { data: recentFees } = await supabase
      .from("applied_late_fees")
      .select("applied_at")
      .eq("invoice_id", invoiceId)
      .eq("policy_id", policyId)
      .order("applied_at", { ascending: false })
      .limit(1);

    if (recentFees && recentFees.length > 0) {
      if (policy.frequency === "once") {
        return { skipped: true, reason: "Fee already applied for this one-time policy" };
      }
      const lastAppliedAt = new Date(recentFees[0].applied_at).getTime();
      const intervalMs = (policy.frequency === "weekly" ? 7 : 30) * 24 * 60 * 60 * 1000;
      if (Date.now() - lastAppliedAt < intervalMs) {
        return { skipped: true, reason: "Fee already applied for the current period" };
      }
    }

    // Apply fee via steps to ensure reliability
    await step.run("update-xero-qb", async () => {
      // Hardcoded to always create a new invoice for late fees
      if (invoice.xero_id || invoice.xero_invoice_id) {
        const { createXeroLateFeeInvoice } = await import("@/lib/xero-write");
        await createXeroLateFeeInvoice(
          policy.organization_id,
          invoice.invoice_number || invoice.id,
          feeAmount,
          invoice.clients.name,
          invoice.clients.email,
          dueDate,
          (policy.tax_treatment as "no_tax" | "exclusive" | "inclusive") ?? "no_tax"
        );
      } else if (invoice.quickbooks_id || invoice.quickbooks_invoice_id) {
        // QuickBooks late-fee lines are always non-taxable (TaxCodeRef "NON").
        // Honouring policy.tax_treatment for QB needs a company-specific tax code
        // and is a follow-up; the treatment applies to Xero only for now.
        const { createQuickBooksLateFeeInvoice } = await import("@/lib/quickbooks-write");
        await createQuickBooksLateFeeInvoice(
          policy.organization_id,
          invoice.invoice_number || invoice.id,
          feeAmount,
          invoice.clients.name,
          invoice.clients.email,
          dueDate
        );
      }
    });

    // Stable across every retry of this run, distinct for a genuinely new late
    // fee. event.id is assigned by Inngest when the event is received and does
    // not change when a step is retried, so it doubles as the row-level
    // idempotency key for applied_late_fees below and the Resend send key later.
    const idempotencyKey = `late-fee-${event.id ?? `${invoiceId}-${policyId}-${feeAmount}`}`;

    // Recording the fee and its audit event are separate steps: Inngest
    // memoizes each on success, so a retry after the fee row commits re-runs
    // only what's left rather than inserting the fee a second time. The unique
    // idempotency_key is the hard guarantee behind that.
    const feeRecord = await step.run("record-applied-fee", async () => {
      const { error } = await supabase.from("applied_late_fees").insert({
        invoice_id: invoice.id,
        policy_id: policy.id,
        amount: feeAmount,
        idempotency_key: idempotencyKey,
      });
      // 23505 = a prior attempt already recorded this exact application; that's
      // the dedup working, not a failure. Anything else is a real error.
      if (error && error.code !== "23505") throw error;
      return { inserted: !error };
    });

    await step.run("record-fee-event", async () => {
      await supabase.from("events").insert({
        invoice_id: invoice.id,
        client_id: invoice.client_id || invoice.customer_id,
        organization_id: policy.organization_id,
        event_type: "late_fee_applied",
        description: `Applied late fee of ${feeAmount} ${invoice.currency} from policy: ${policy.name}`
      });
    });

    const sendResult = await step.run("send-email", async () => {
      let clientEmail = invoice.clients.email;

      if (!clientEmail) {
        // Best-effort backfill only - a failure here (e.g. the invoice was a
        // draft since deleted in Xero/QuickBooks, or a transient API error)
        // must not block the late fee notification below. If it fails,
        // clientEmail simply stays unset and the "no email available"
        // fallback further down records a visible failed draft instead.
        try {
          if (invoice.xero_id || invoice.xero_invoice_id) {
            const { getXeroIntegration, getValidXeroClient, fetchXeroInvoice } = await import("@/lib/xero");
            const integration = await getXeroIntegration(policy.organization_id);
            const xeroInvoiceId = invoice.xero_invoice_id || invoice.xero_id;
            if (integration && xeroInvoiceId) {
              const { xero: xeroClient } = await getValidXeroClient(integration);
              const xeroInvoice = await fetchXeroInvoice(xeroClient, integration.tenant_id, xeroInvoiceId as string);
              clientEmail = xeroInvoice?.contact?.emailAddress || null;
            }
          } else if (invoice.quickbooks_id || invoice.quickbooks_invoice_id) {
            const { getQuickBooksIntegration, getValidQuickBooksTokens, fetchQuickBooksInvoice } = await import("@/lib/quickbooks");
            const integration = await getQuickBooksIntegration(policy.organization_id);
            const qbInvoiceId = invoice.quickbooks_invoice_id || invoice.quickbooks_id;
            if (integration && qbInvoiceId) {
              const tokens = await getValidQuickBooksTokens(integration);
              const qbInvoice = await fetchQuickBooksInvoice(tokens.access_token, integration.realm_id as string, qbInvoiceId as string);
              clientEmail = qbInvoice?.BillEmail?.Address || null;
            }
          }
        } catch (backfillError) {
          logger.error({
            message: "Failed to backfill client email from accounting software for late fee notification",
            context: "process-late-fee",
            error: backfillError instanceof Error ? backfillError.message : String(backfillError),
            organization_id: policy.organization_id,
          });
        }

        if (clientEmail) {
          await supabase.from("clients").update({ email: clientEmail }).eq("id", invoice.client_id || invoice.customer_id);
        }
      }

      if (clientEmail && subject && body_html) {
        // Fetch sender profile
        const { data: { user } } = await supabase.auth.admin.getUserById(adminUserId);
        const senderName = user?.user_metadata?.full_name || "Duely";
        const senderEmail = user?.email || "";

        // Resend's id, kept so the delivery webhook can match a bounce or
        // complaint back to this row hours later. Gmail sends produce no id and
        // no webhooks, so they stay null and show as untracked.
        let resendEmailId: string | null = null;

        const sendViaResend = async () => {
          const resend = getResendClient();
          const { data, error } = await resend.emails.send(
            {
              from: `${senderName} via Duely <reminders@duely.in>`,
              to: clientEmail,
              subject,
              html: body_html,
              replyTo: senderEmail || undefined
            },
            // Second line of defence against a duplicate late-fee email. If this
            // step is retried after Resend already accepted the message (a
            // response lost to a network blip, say), Resend recognises the key
            // and returns the original send instead of mailing the client twice.
            // The key is derived from the event, so it is stable across retries
            // of this run but different for a genuinely new late fee.
            { idempotencyKey }
          );
          // The SDK reports failures in `error` rather than throwing, so without
          // this a rejected send would still be recorded as "sent".
          if (error) throw new Error(error.message);
          return data?.id ?? null;
        };

        const gmailAvailable = await hasGmailTokens(adminUserId);
        if (gmailAvailable) {
          try {
            await sendGmail({
              userId: adminUserId,
              senderName,
              senderEmail,
              to: clientEmail,
              subject,
              body: body_html,
              html: true
            });
          } catch {
            resendEmailId = await sendViaResend();
          }
        } else {
          resendEmailId = await sendViaResend();
        }

        return { outcome: "sent" as const, resendEmailId };
      }

      if (!clientEmail) {
        return { outcome: "no_email" as const, resendEmailId: null };
      }

      return { outcome: "skipped" as const, resendEmailId: null };
    });

    // Recording the send is its own step. Previously the insert lived inside
    // "send-email": if it failed, Inngest retried the whole step and the client
    // received a second late-fee email. Now the send is memoized on success, so a
    // retry here re-runs only the insert.
    await step.run("record-sent-email", async () => {
      if (sendResult.outcome === "sent") {
        // A late-fee email that actually sent never appeared in the Automate
        // tab's Sent list: that list only reads email_drafts, and this path
        // previously wrote a row only when the send failed for want of an
        // address. The successful case wrote nothing at all.
        await supabase.from("email_drafts").insert({
          organization_id: policy.organization_id,
          client_id: invoice.client_id || invoice.customer_id,
          subject,
          body_html,
          status: "sent",
          sent_at: new Date().toISOString(),
          resend_email_id: sendResult.resendEmailId,
          delivery_status: sendResult.resendEmailId ? "sent" : null,
          delivery_status_at: sendResult.resendEmailId ? new Date().toISOString() : null,
          action_type: "late_fee",
          action_payload: {
            invoice_id: invoiceId,
            policy_id: policyId,
            fee_amount: feeAmount,
          },
        });
        return;
      }

      if (sendResult.outcome === "no_email") {
        await supabase.from("email_drafts").insert({
          organization_id: policy.organization_id,
          client_id: invoice.client_id || invoice.customer_id,
          subject: subject || "Late Fee Applied",
          body_html: "Note: Email address was missing from both Duely and your accounting software. The late fee invoice was generated, but this email notification was not sent.\n\n" + (body_html || ""),
          status: "failed",
          action_type: "late_fee",
          action_payload: {
            fee_amount: feeAmount
          }
        });
      }
    });

    // A recurring policy normally schedules its next period from within the
    // still-running late-fee-workflow loop. But when this fee came from a draft
    // being approved, that workflow already exited (it can't sleep waiting on a
    // human), so nothing is left to schedule the next occurrence. Re-arm it with
    // a fresh evaluation, which sleeps until applied_at + the frequency interval
    // and drafts the next fee. Only on a genuinely new application (not a
    // deduped retry) and only for recurring policies.
    if (fromDraftApproval && feeRecord.inserted && policy.frequency !== "once") {
      await step.run("schedule-next-period", async () => {
        await inngest.send({
          name: "invoice.evaluate_late_fee",
          data: { invoiceId, organizationId: policy.organization_id },
        });
      });
    }

    return { success: true };
  }
);
