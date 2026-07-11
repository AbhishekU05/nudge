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

    // Check balance again
    const balance = Math.max(0, Number(invoice.amount_owed || invoice.amount || 0) - Number(invoice.amount_paid || 0));
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
          dueDate
        );
      } else if (invoice.quickbooks_id || invoice.quickbooks_invoice_id) {
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

    await step.run("update-database", async () => {
      await supabase.from("applied_late_fees").insert({
        invoice_id: invoice.id,
        policy_id: policy.id,
        amount: feeAmount
      });

      await supabase.from("events").insert({
        invoice_id: invoice.id,
        client_id: invoice.client_id || invoice.customer_id,
        organization_id: policy.organization_id,
        event_type: "late_fee_applied",
        description: `Applied late fee of ${feeAmount} ${invoice.currency} from policy: ${policy.name}`
      });
    });

    await step.run("send-email", async () => {
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
            const resend = getResendClient();
            await resend.emails.send({
              from: `${senderName} via Duely <reminders@duely.in>`,
              to: clientEmail,
              subject,
              html: body_html,
              replyTo: senderEmail || undefined
            });
          }
        } else {
          const resend = getResendClient();
          await resend.emails.send({
            from: `${senderName} via Duely <reminders@duely.in>`,
            to: clientEmail,
            subject,
            html: body_html,
            replyTo: senderEmail || undefined
          });
        }
      } else if (!clientEmail) {
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

    return { success: true };
  }
);
