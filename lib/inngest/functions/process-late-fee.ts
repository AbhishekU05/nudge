import { inngest } from "@/lib/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendGmail, hasGmailTokens } from "@/lib/gmail";
import { getResendClient } from "@/lib/resend";

export const processLateFee = inngest.createFunction(
  { id: "process-late-fee", retries: 3, triggers: [{ event: "invoice.apply_late_fee" }] },
  async ({ event, step }) => {
    const {
      invoiceId,
      policyId,
      adminUserId,
      feeAmount,
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

    // Apply Fee Logic
    let newAmount = Number(invoice.amount_owed || invoice.amount || 0);

    // Apply fee via steps to ensure reliability
    await step.run("update-xero-qb", async () => {
      if (policy.apply_to === "existing_invoice") {
        if (invoice.xero_id || invoice.xero_invoice_id) {
          const { updateXeroInvoiceWithLateFee } = await import("@/lib/xero-write");
          await updateXeroInvoiceWithLateFee(
            policy.organization_id,
            invoice.xero_id || invoice.xero_invoice_id,
            feeAmount
          );
        } else if (invoice.quickbooks_id || invoice.quickbooks_invoice_id) {
          const { updateQuickBooksInvoiceWithLateFee } = await import("@/lib/quickbooks-write");
          await updateQuickBooksInvoiceWithLateFee(
            policy.organization_id,
            invoice.quickbooks_id || invoice.quickbooks_invoice_id,
            feeAmount
          );
        }
      } else {
        if (invoice.xero_id || invoice.xero_invoice_id) {
          const { createXeroLateFeeInvoice } = await import("@/lib/xero-write");
          await createXeroLateFeeInvoice(
            policy.organization_id,
            invoice.invoice_number || invoice.id,
            feeAmount,
            invoice.clients.name,
            invoice.clients.email
          );
        } else if (invoice.quickbooks_id || invoice.quickbooks_invoice_id) {
          const { createQuickBooksLateFeeInvoice } = await import("@/lib/quickbooks-write");
          await createQuickBooksLateFeeInvoice(
            policy.organization_id,
            invoice.invoice_number || invoice.id,
            feeAmount,
            invoice.clients.name,
            invoice.clients.email
          );
        }
      }
    });

    await step.run("update-database", async () => {
      if (policy.apply_to === "existing_invoice") {
        newAmount += feeAmount;
        await supabase
          .from("invoices")
          .update({ amount: newAmount })
          .eq("id", invoice.id);
      }

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
      if (invoice.clients.email && subject && body_html) {
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
              to: invoice.clients.email,
              subject,
              body: body_html,
              html: true
            });
          } catch {
            const resend = getResendClient();
            await resend.emails.send({
              from: `${senderName} via Duely <reminders@duely.in>`,
              to: invoice.clients.email,
              subject,
              html: body_html,
              replyTo: senderEmail || undefined
            });
          }
        } else {
          const resend = getResendClient();
          await resend.emails.send({
            from: `${senderName} via Duely <reminders@duely.in>`,
            to: invoice.clients.email,
            subject,
            html: body_html,
            replyTo: senderEmail || undefined
          });
        }
      }
    });

    return { success: true };
  }
);
