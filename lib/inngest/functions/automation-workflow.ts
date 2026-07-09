import { inngest } from "@/lib/inngest/client";
import { sendGmail, hasGmailTokens } from "@/lib/gmail";
import { getResendClient } from "@/lib/resend";
import { isAutomationAndIntegrationAllowed } from "@/lib/payments";
import { computeRecurringReminderSendAt } from "@/lib/reminder-schedule";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getAppUrl } from "@/lib/email/reminder";

type Template = { subject: string; body_html: string; days_offset?: number };

function processTemplate(template: Template, vars: Record<string, string>) {
  let subject = template.subject || "";
  let body = template.body_html || "";

  body = body.replace(/<\/?p>/g, '\n').replace(/<br\s*\/?>/gi, '\n');
  body = body.replace(/<[^>]+>/g, '');
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }
  return { subject, body };
}

export const automationWorkflow = inngest.createFunction(
  {
    id: "automation-workflow",
    cancelOn: [
      { event: "automation.disabled", match: "data.entityId" },
      { event: "invoice.paid", match: "data.entityId" }, // For invoice-level workflows
    ],
  },
  async ({ event, step }) => {
    const { entityId, entityType, organizationId } = event.data as any;

    let isFinished = false;

    while (!isFinished) {
      // 1. Fetch Entity & Compute Next Send At
      const entity = await step.run("fetch-entity", async () => {
        const supabase = createSupabaseAdminClient();
        if (entityType === "client") {
          const { data } = await supabase.from("clients").select("*").eq("id", entityId).single();
          return data ? { ...data, email: data.email, active: data.active, templates: data.reminder_templates, type: "client" } : null;
        } else {
          const { data } = await supabase.from("invoices").select("*, clients(unsubscribe_token, email)").eq("id", entityId).single();
          return data ? { ...data, email: data.recipient_email || data.clients?.email, active: data.reminders_enabled, templates: data.reminder_templates, type: "invoice", unsubscribe_token: data.clients?.unsubscribe_token } : null;
        }
      });

      if (!entity || !entity.active || entity.unsubscribed || entity.unsubscribe_token || entity.status === "paid") {
        return { status: "cancelled", reason: "Entity inactive, unsubscribed, or paid." };
      }

      if (entity.next_send_at) {
        // Sleep until next send time
        const sleepDuration = new Date(entity.next_send_at).getTime() - Date.now();
        if (sleepDuration > 0) {
            await step.sleepUntil("wait-for-schedule", entity.next_send_at);
        }
      }

      // WAKE UP: JIT Verification
      const readyEntity = await step.run("jit-verify-entity", async () => {
        const supabase = createSupabaseAdminClient();
        if (entityType === "client") {
          const { data } = await supabase.from("clients").select("*").eq("id", entityId).single();
          return data ? { ...data, email: data.email, active: data.active, templates: data.reminder_templates, type: "client" } : null;
        } else {
          const { data } = await supabase.from("invoices").select("*, clients(unsubscribe_token, email)").eq("id", entityId).single();
          return data ? { ...data, email: data.recipient_email || data.clients?.email, active: data.reminders_enabled, templates: data.reminder_templates, type: "invoice", unsubscribe_token: data.clients?.unsubscribe_token } : null;
        }
      });

      if (!readyEntity || !readyEntity.active || readyEntity.unsubscribed || readyEntity.unsubscribe_token || readyEntity.status === "paid") {
        return { status: "cancelled", reason: "Entity became inactive while sleeping." };
      }
      
      const subAllowed = await step.run("check-subscription", async () => {
         const supabase = createSupabaseAdminClient();
         const { data } = await supabase.from("organizations").select("dodo_subscription_status, created_at").eq("id", organizationId).single();
         return isAutomationAndIntegrationAllowed(data?.dodo_subscription_status, data?.created_at);
      });
      if (!subAllowed) {
         return { status: "cancelled", reason: "Subscription disabled." };
      }

      // PREPARE AND SEND EMAIL
      const sendResult = await step.run("send-email", async () => {
        const supabase = createSupabaseAdminClient();
        const { data: members } = await supabase.from("organization_members").select("user_id").eq("organization_id", organizationId).in("role", ["owner", "admin"]).limit(1);
        const adminUserId = members?.[0]?.user_id;
        
        let sender = { name: "Someone", email: null as string | null, user_id: adminUserId };
        if (adminUserId) {
            const { data: { user } } = await supabase.auth.admin.getUserById(adminUserId);
            if (user) { sender.name = user.user_metadata?.full_name || "Someone"; sender.email = user.email ?? null; }
        }

        const templates = readyEntity.templates || [];
        const tpl = templates[readyEntity.sequence_index] || templates[templates.length - 1] || { subject: "Reminder", body_html: "" };

        let textBody = "";
        let subject = "";

        if (entityType === "client") {
          const { data: invoices } = await supabase.from("invoices").select("*").eq("client_id", entityId).neq("status", "paid").eq("organization_id", organizationId);
          const activeInvoices = invoices || [];
          
          if (activeInvoices.length === 0) {
            await supabase.from("clients").update({ active: false }).eq("id", entityId);
            return { skipped: true };
          }

          const totalAmountOwed = activeInvoices.reduce((sum, inv) => sum + (Number(inv.amount_owed) || Number(inv.amount) || 0), 0);
          const currency = activeInvoices[0]?.currency || "USD";
          
          let invoiceListTxt = "";
          for (const inv of activeInvoices) { invoiceListTxt += `- Invoice #${inv.invoice_number || inv.id} (${inv.currency || "USD"} ${inv.amount_owed || inv.amount})\n`; }
          
          const vars = {
            "first_name": (readyEntity.name || "Client").split(" ")[0],
            "company_name": readyEntity.name || "Client",
            "amount_owed": `${totalAmountOwed}`,
            "currency": currency,
            "invoice_count": `${activeInvoices.length}`,
            "invoice_details": invoiceListTxt.trim() || "No outstanding invoices.",
            "portal_link": `${getAppUrl()}/portal/client-${readyEntity.id}`,
            "sender_name": sender.name
          };
          const processed = processTemplate(tpl, vars);
          subject = processed.subject; 
          textBody = processed.body;
        } else {
           const vars = {
             "first_name": (readyEntity.recipient_name || "Client").split(" ")[0],
             "company_name": readyEntity.recipient_name || "Client",
             "amount_owed": `${readyEntity.amount_owed || readyEntity.amount}`,
             "currency": readyEntity.currency || "USD",
             "invoice_number": readyEntity.invoice_number || readyEntity.id,
             "invoice_details": `- Invoice #${readyEntity.invoice_number || readyEntity.id} (${readyEntity.currency || "USD"} ${readyEntity.amount_owed || readyEntity.amount})`,
             "portal_link": `${getAppUrl()}/portal/${readyEntity.id}`,
             "sender_name": sender.name
           };
           const processed = processTemplate(tpl, vars);
           subject = processed.subject; 
           textBody = processed.body;
        }

        if (readyEntity.auto_approve) {
            try {
                if (sender.user_id && sender.email && await hasGmailTokens(sender.user_id)) {
                    await sendGmail({ userId: sender.user_id, senderName: sender.name, senderEmail: sender.email, to: readyEntity.email, subject, body: textBody, html: false });
                } else {
                    const resend = getResendClient();
                    await resend.emails.send({ from: `${sender.name} via Duely <reminders@duely.in>`, to: readyEntity.email, subject, text: textBody, replyTo: sender.email || undefined });
                }
            } catch (err) {
                 // Throw to let Inngest native retry handle it!
                 throw new Error("Failed to send email");
            }
        } else {
             // Create draft instead of sending
             await supabase.from("email_drafts").insert({ organization_id: organizationId, client_id: entityType === "client" ? entityId : (readyEntity.client_id || readyEntity.customer_id), invoice_id: entityType === "invoice" ? entityId : null, recipient_email: readyEntity.email, subject, body: textBody, status: "pending" });
        }

        return { skipped: false };
      });

      if (sendResult?.skipped) {
         return { status: "cancelled", reason: "Client has no active invoices. Automation disabled." };
      }

      // ADVANCE SEQUENCE
      const { hasMore } = await step.run("advance-sequence", async () => {
        const supabase = createSupabaseAdminClient();
        const templates = readyEntity.templates || [];
        
        const sentOrDraftedAt = new Date();
        let nextSequenceIndex = readyEntity.sequence_index;
        let nextSendAtStr;
        let hasMoreSequence = true;

        if (readyEntity.reminder_type === "sequence") {
          if (nextSequenceIndex < templates.length - 1) {
            nextSequenceIndex += 1;
            const nextOffset = templates[nextSequenceIndex].days_offset || 7;
            nextSendAtStr = computeRecurringReminderSendAt(nextOffset, sentOrDraftedAt);
          } else {
            hasMoreSequence = false;
          }
        } else {
          nextSendAtStr = computeRecurringReminderSendAt(readyEntity.reminder_frequency_days, sentOrDraftedAt);
        }

        const updatePayload: any = {
           last_sent_at: sentOrDraftedAt.toISOString(),
           sequence_index: nextSequenceIndex
        };
        if (hasMoreSequence) {
           updatePayload.next_send_at = nextSendAtStr;
        } else {
           if (entityType === "invoice") updatePayload.reminders_enabled = false;
           else updatePayload.active = false;
        }

        await supabase.from(entityType === "client" ? "clients" : "invoices").update(updatePayload).eq("id", entityId);

        return { hasMore: hasMoreSequence };
      });

      isFinished = !hasMore;
    }
    
    return { status: "completed" };
  }
);
