import { inngest } from "@/lib/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendGmail, hasGmailTokens } from "@/lib/gmail";
import { getResendClient } from "@/lib/resend";

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
