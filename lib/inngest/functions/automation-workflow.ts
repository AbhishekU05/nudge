import { inngest } from "@/lib/inngest/client";
import { sendGmail, hasGmailTokens } from "@/lib/gmail";
import { getResendClient } from "@/lib/resend";
import { isAutomationAndIntegrationAllowed } from "@/lib/payments";
import { computeRecurringReminderSendAt } from "@/lib/reminder-schedule";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
    triggers: [{ event: "automation.enabled" }],
    // automation.enabled is re-fired on every settings save, including
    // re-saving an already-active automation (e.g. tweaking a template).
    // Without cancelling the prior run for the same entity, two durable
    // workflow instances end up sleeping and independently emailing the
    // customer. Matching the trigger event here cancels the stale run the
    // moment the new one is triggered - concurrency below is a backstop in
    // case the cancellation itself lags.
    cancelOn: [
      { event: "automation.disabled", match: "data.entityId" },
      { event: "invoice.paid", match: "data.entityId" }, // For invoice-level workflows
      { event: "invoice.due_date_updated", match: "data.entityId" },
      { event: "automation.enabled", match: "data.entityId" },
    ],
    concurrency: {
      limit: 1,
      key: "event.data.entityId",
    },
  },
  async ({ event, step }) => {
    const { entityId, entityType, organizationId } = event.data as { entityId: string; entityType: string; organizationId: string; };

    let isFinished = false;

    while (!isFinished) {
      // 1. Fetch Entity & Compute Next Send At
      const entity = await step.run("fetch-entity", async () => {
        const supabase = createSupabaseAdminClient();
        if (entityType === "client") {
          const { data } = await supabase.from("clients").select("*").eq("id", entityId).single();
          return data ? { ...data, email: data.email, active: data.active, templates: data.reminder_templates, type: "client" } : null;
        } else {
          const { data } = await supabase.from("invoices").select("*, clients(unsubscribed, email)").eq("id", entityId).single();
          return data ? { ...data, email: data.recipient_email || data.clients?.email, active: data.reminders_enabled, templates: data.reminder_templates, type: "invoice", unsubscribed: data.clients?.unsubscribed } : null;
        }
      });

      // unsubscribe_token is a permanent per-client UUID (DEFAULT
      // gen_random_uuid() on every row - see 20260705000001_add_unsubscribe_
      // token.sql) used to build portal/unsubscribe links, not a flag that a
      // client has actually unsubscribed. It used to be checked here
      // directly, which is always truthy and cancelled every run
      // immediately - unsubscribed (the real boolean) is the correct check.
      if (!entity || !entity.active || entity.unsubscribed || entity.status === "paid" || entity.status === "written_off") {
        return { status: "cancelled", reason: "Entity inactive, unsubscribed, paid, or written off." };
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
          const { data } = await supabase.from("invoices").select("*, clients(unsubscribed, email)").eq("id", entityId).single();
          return data ? { ...data, email: data.recipient_email || data.clients?.email, active: data.reminders_enabled, templates: data.reminder_templates, type: "invoice", unsubscribed: data.clients?.unsubscribed } : null;
        }
      });

      if (!readyEntity || !readyEntity.active || readyEntity.unsubscribed || readyEntity.status === "paid" || readyEntity.status === "written_off") {
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
        const { data: orgData } = await supabase.from("organizations").select("name").eq("id", organizationId).single();
        const orgName = orgData?.name || "Our Company";
        
        const { data: members } = await supabase.from("organization_members").select("user_id").eq("organization_id", organizationId).in("role", ["owner", "admin"]).limit(1);
        const adminUserId = members?.[0]?.user_id;
        
        const sender = { name: "Someone", email: null as string | null, user_id: adminUserId, company: orgName };
        if (adminUserId) {
            const { data: { user } } = await supabase.auth.admin.getUserById(adminUserId);
            if (user) { sender.name = user.user_metadata?.full_name || "Someone"; sender.email = user.email ?? null; }
        }

        const templates = readyEntity.templates || [];
        const tpl = templates[readyEntity.sequence_index] || templates[templates.length - 1] || { subject: "Reminder", body_html: "" };

        let textBody = "";
        let subject = "";

        if (entityType === "client") {
          const { data: invoices } = await supabase.from("invoices").select("*").eq("client_id", entityId).not("status", "in", '("paid","written_off")').eq("organization_id", organizationId);
          const activeInvoices = invoices || [];
          
          if (activeInvoices.length === 0) {
            await supabase.from("clients").update({ active: false }).eq("id", entityId);
            return { skipped: true };
          }

          const totalAmountOwed = activeInvoices.reduce((sum, inv) => {
            const balance = Math.max(0, Number(inv.amount_owed || inv.amount || 0) - Number(inv.amount_paid || 0));
            return sum + balance;
          }, 0);
          const currency = activeInvoices[0]?.currency || "USD";
          
          const fmt = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          let invoiceListTxt = "";
          for (const inv of activeInvoices) { 
            const balance = Math.max(0, Number(inv.amount_owed || inv.amount || 0) - Number(inv.amount_paid || 0));
            invoiceListTxt += `- Invoice #${inv.invoice_number || inv.id} (${inv.currency || "USD"} ${fmt.format(balance)})\n`; 
          }
          
          const vars = {
            "first_name": (readyEntity.name || "Client").split(" ")[0],
            "company_name": readyEntity.name || "Client",
            "amount_owed": fmt.format(totalAmountOwed),
            "currency": currency,
            "invoice_count": `${activeInvoices.length}`,
            "invoice_details": invoiceListTxt.trim() || "No outstanding invoices.",
            "portal_link": `${getAppUrl()}/portal/client-${readyEntity.id}`,
            "sender_name": sender.name,
            "sender_company": sender.company
          };
          const processed = processTemplate(tpl, vars);
          subject = processed.subject; 
          textBody = processed.body;
        } else {
           const balance = Math.max(0, Number(readyEntity.amount_owed || readyEntity.amount || 0) - Number(readyEntity.amount_paid || 0));
           const fmt = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
           const vars = {
             "first_name": (readyEntity.recipient_name || "Client").split(" ")[0],
             "company_name": readyEntity.recipient_name || "Client",
             "amount_owed": fmt.format(balance),
             "currency": readyEntity.currency || "USD",
             "invoice_number": readyEntity.invoice_number || readyEntity.id,
             "invoice_details": `- Invoice #${readyEntity.invoice_number || readyEntity.id} (${readyEntity.currency || "USD"} ${fmt.format(balance)})`,
             "portal_link": `${getAppUrl()}/portal/${readyEntity.id}`,
             "sender_name": sender.name,
             "sender_company": sender.company
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
            } catch {
                 throw new Error("Failed to send email");
            }
        } else {
             // Create draft instead of sending. Matches the shape
             // late-fee-workflow.ts uses and app/(app)/automate/page.tsx
             // reads: body_html (not body), status "draft" (what the
             // Automate tab actually filters on, not "pending"), and no
             // invoice_id/recipient_email columns - email_drafts doesn't
             // have either; the client's email comes via the clients(...)
             // join and any invoice reference belongs in action_payload.
             await supabase.from("email_drafts").insert({
               organization_id: organizationId,
               client_id: entityType === "client" ? entityId : (readyEntity.client_id || readyEntity.customer_id),
               subject,
               body_html: textBody,
               status: "draft",
               action_type: "email",
               action_payload: {
                 invoice_id: entityType === "invoice" ? entityId : null,
                 recipient_email: readyEntity.email,
               },
             });
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

        const updatePayload: Record<string, string | number | boolean | undefined> = {
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
