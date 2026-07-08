import crypto from "crypto";
import { inngest } from "@/lib/inngest/client";
import { sendGmail, hasGmailTokens } from "@/lib/gmail";
import { getResendClient } from "@/lib/resend";
import { isAutomationAndIntegrationAllowed } from "@/lib/payments";
import { computeRecurringReminderSendAt } from "@/lib/reminder-schedule";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const CLAIM_WINDOW_MS = 5 * 60 * 1000;

type Template = { subject: string; body_html: string; days_offset?: number };

type DueEntity = {
  type: "client" | "invoice";
  id: string;
  organization_id: string;
  recipient_name: string;
  email: string;
  reminder_type: "recurring" | "sequence";
  reminder_templates: Template[];
  sequence_index: number;
  reminder_frequency_days: number;
  unsubscribe_token?: string;
  next_send_at: string;
  last_sent_at: string | null;
  active: boolean;
  auto_approve: boolean;
  // invoice specific
  invoice_number?: string | null;
  amount_owed?: number;
  currency?: string;
  client_id?: string;
};

async function claimEntity(params: { table: "clients" | "invoices"; id: string; nextSendAt: string; nowIso: string }) {
  const leaseUntil = new Date(Date.now() + CLAIM_WINDOW_MS).toISOString();
  const supabase = createSupabaseAdminClient();

  const activeCol = params.table === "invoices" ? "reminders_enabled" : "active";

  const { data, error } = await supabase
    .from(params.table)
    .update({ next_send_at: leaseUntil })
    .eq("id", params.id)
    .eq(activeCol, true)
    .eq("next_send_at", params.nextSendAt)
    .lte("next_send_at", params.nowIso)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !data) return null;
  return leaseUntil;
}

async function restoreClaim(params: { table: "clients" | "invoices"; id: string; leaseUntil: string; originalNextSendAt: string }) {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from(params.table)
    .update({ next_send_at: params.originalNextSendAt })
    .eq("id", params.id)
    .eq("next_send_at", params.leaseUntil);
}

function processTemplate(template: Template, vars: Record<string, string>) {
  let subject = template.subject || "";
  let body = template.body_html || "";

  // Convert basic HTML to newlines if legacy HTML exists
  body = body.replace(/<\/?p>/g, '\n').replace(/<br\s*\/?>/gi, '\n');
  // Strip all other HTML tags
  body = body.replace(/<[^>]+>/g, '');
  // Clean up excessive newlines
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  return { subject, body };
}

export const sendReminders = inngest.createFunction(
  { id: "send-reminders", triggers: [{ cron: "0 * * * *" }] },
  async () => {
    const requestId = crypto.randomUUID();
    logger.cron({ job_name: "send_reminders", status: "start", request_id: requestId });

    const supabase = createSupabaseAdminClient();
    const nowIso = new Date().toISOString();

    // 1. Fetch eligible clients
    const { data: clientsData } = await supabase
      .from("clients")
      .select("*")
      .eq("active", true)
      .eq("unsubscribed", false)
      .lte("next_send_at", nowIso)
      .order("next_send_at", { ascending: true })
      .limit(30);

    // 2. Fetch eligible invoices
    const { data: invoicesData } = await supabase
      .from("invoices")
      .select("*, clients(unsubscribe_token)")
      .eq("reminders_enabled", true)
      .neq("status", "paid") // updated from workflow_status
      .lte("next_send_at", nowIso)
      .order("next_send_at", { ascending: true })
      .limit(30);

    const entities: DueEntity[] = [
      ...(clientsData || []).map((c) => ({
        type: "client" as const,
        id: c.id,
        organization_id: c.organization_id,
        recipient_name: c.name,
        email: c.email,
        reminder_type: c.reminder_type,
        reminder_templates: c.reminder_templates,
        sequence_index: c.sequence_index,
        reminder_frequency_days: c.reminder_frequency_days,
        next_send_at: c.next_send_at,
        last_sent_at: c.last_sent_at,
        active: c.active,
        auto_approve: c.auto_approve,
        unsubscribe_token: c.unsubscribe_token,
      })),
      ...(invoicesData || []).map((i) => ({
        type: "invoice" as const,
        id: i.id,
        organization_id: i.organization_id,
        recipient_name: i.recipient_name,
        email: i.recipient_email,
        reminder_type: i.reminder_type,
        reminder_templates: i.reminder_templates,
        sequence_index: i.sequence_index,
        reminder_frequency_days: i.reminder_frequency_days,
        next_send_at: i.next_send_at,
        last_sent_at: i.last_sent_at,
        active: i.reminders_enabled,
        auto_approve: i.auto_approve,
        invoice_number: i.invoice_number,
        amount_owed: i.amount_owed || i.amount,
        currency: i.currency,
        client_id: i.client_id || i.customer_id,
        unsubscribe_token: i.clients?.unsubscribe_token,
      }))
    ];

    if (entities.length === 0) {
      return { ok: true, processed: 0 };
    }

    const orgIds = [...new Set(entities.map((e) => e.organization_id))];

    // Fetch subscriptions and created_at
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id,dodo_subscription_status,created_at")
      .in("id", orgIds);

    const orgSubMap = new Map((orgs ?? []).map((o) => [o.id, { status: o.dodo_subscription_status, createdAt: o.created_at }]));

    // Fetch org admins
    const authUsersMap = new Map<string, { email: string | null; name: string, user_id: string }>();
    for (const orgId of orgIds) {
      const { data: members } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", orgId)
        .in("role", ["owner", "admin"])
        .limit(1);
      
      const adminUserId = members?.[0]?.user_id;
      if (adminUserId) {
        const { data: { user } } = await supabase.auth.admin.getUserById(adminUserId);
        if (user) {
          authUsersMap.set(orgId, {
            user_id: adminUserId,
            email: user.email ?? null,
            name: user.user_metadata?.full_name || "Someone",
          });
        }
      }
    }

    // Fetch monthly email counts
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthIso = startOfMonth.toISOString();

    const monthlyCountsMap = new Map<string, number>();
    for (const orgId of orgIds) {
      const { count } = await supabase
        .from("email_drafts")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("status", "sent")
        .gte("sent_at", startOfMonthIso);
      
      monthlyCountsMap.set(orgId, count || 0);
    }

    let claimed = 0;
    let sent = 0;
    let drafted = 0;
    let failed = 0;

    for (const entity of entities) {
      const orgInfo = orgSubMap.get(entity.organization_id) ?? { status: null, createdAt: null };

      if (!isAutomationAndIntegrationAllowed(orgInfo.status, orgInfo.createdAt)) {
        await supabase.from(entity.type === "client" ? "clients" : "invoices").update({ active: false }).eq("id", entity.id);
        continue;
      }

      const table = entity.type === "client" ? "clients" : "invoices";
      const leaseUntil = await claimEntity({ table, id: entity.id, nextSendAt: entity.next_send_at, nowIso });
      if (!leaseUntil) continue;

      claimed += 1;

      try {
        const sender = authUsersMap.get(entity.organization_id);
        if (!sender || !entity.email || entity.email.trim() === "") {
          await supabase.from(table).update({ active: false }).eq("id", entity.id);
          failed += 1;
          continue;
        }

        const monthlySent = monthlyCountsMap.get(entity.organization_id) || 0;
        if (entity.auto_approve && monthlySent >= 10000) {
          entity.auto_approve = false;
          console.warn(`Monthly email limit reached for org ${entity.organization_id}, forcing draft`);
        }

        // Pick template
        const templates = entity.reminder_templates || [];
        const tpl = templates[entity.sequence_index] || templates[templates.length - 1] || { subject: "Reminder", body_html: "" };

        let textBody = "";
        let subject = "";

        if (entity.type === "client") {
          // Fetch all outstanding invoices
          const { data: invoices } = await supabase
            .from("invoices")
            .select("*")
            .eq("client_id", entity.id)
            .neq("status", "paid")
            .order("due_date", { ascending: true });

          if (!invoices || invoices.length === 0) {
            await supabase.from("clients").update({ active: false }).eq("id", entity.id);
            continue;
          }

          const totalOwed = invoices.reduce((acc, inv) => acc + (inv.amount_owed || inv.amount || 0), 0);
          const currency = invoices[0]?.currency || "USD";
          const totalFormatted = new Intl.NumberFormat(undefined, { style: "currency", currency }).format(totalOwed);

          const vars = {
            company_name: sender.name,
            first_name: entity.recipient_name.split(" ")[0],
            invoice_count: invoices.length.toString(),
            total_owed: totalFormatted,
          };

          const processed = processTemplate(tpl, vars);
          subject = processed.subject;

          // Append text list
          const textList = invoices.map(inv => {
            const invName = inv.invoice_number || "Invoice";
            const due = inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'Upon receipt';
            const amt = new Intl.NumberFormat("en-US", { style: "currency", currency: inv.currency || "USD" }).format(inv.amount_owed || inv.amount || 0);
            return `- ${invName} (Due: ${due}): ${amt}`;
          }).join('\n');

          textBody = `${processed.body}\n\nOutstanding Invoices:\n${textList}`;
          if (entity.unsubscribe_token) {
            textBody += `\n\nPayment Link: https://duely.in/portal/${entity.unsubscribe_token}`;
          }

        } else {
          // Invoice logic
          const currency = entity.currency || "USD";
          const amountFormatted = new Intl.NumberFormat(undefined, { style: "currency", currency }).format(entity.amount_owed || 0);
          
          const vars = {
            company_name: sender.name,
            first_name: entity.recipient_name.split(" ")[0],
            amount_owed: amountFormatted,
            invoice_number: entity.invoice_number || "Invoice",
          };

          const processed = processTemplate(tpl, vars);
          subject = processed.subject;
          textBody = processed.body;
          if (entity.unsubscribe_token) {
            textBody += `\n\nPayment Link: https://duely.in/portal/${entity.unsubscribe_token}`;
          }
        }

        const status = entity.auto_approve ? "sent" : "draft";

        // Insert into email_drafts
        const { error: draftError } = await supabase
          .from("email_drafts")
          .insert({
            user_id: sender.user_id, // keep as user_id for Gmail sender? Or organization_id? Wait, email_drafts usually use user_id or organization_id. Let's provide both if available, or just organization_id.
            organization_id: entity.organization_id, // ensure organization_id is set
            client_id: entity.type === "client" ? entity.id : (entity.client_id || entity.id),
            subject,
            body_html: textBody.replace(/\n/g, "<br>"),
            status,
            sent_at: status === "sent" ? new Date().toISOString() : null,
          })
          .select("id")
          .single();

        if (draftError && !draftError.message.includes("organization_id")) {
           // fallback if email_drafts hasn't been migrated yet to organization_id
           await supabase
             .from("email_drafts")
             .insert({
               user_id: sender.user_id,
               client_id: entity.type === "client" ? entity.id : (entity.client_id || entity.id),
               subject,
               body_html: textBody.replace(/\n/g, "<br>"),
               status,
               sent_at: status === "sent" ? new Date().toISOString() : null,
             })
        }

        // If auto-approve, send it right away
        if (entity.auto_approve) {
          const gmailAvailable = await hasGmailTokens(sender.user_id);
          if (gmailAvailable) {
            try {
              await sendGmail({
                userId: sender.user_id,
                senderName: sender.name,
                senderEmail: sender.email || "",
                to: entity.email,
                subject,
                body: textBody,
                html: false,
              });
            } catch {
              const resend = getResendClient();
              await resend.emails.send({
                from: `${sender.name} via Duely <reminders@duely.in>`,
                to: entity.email,
                subject,
                text: textBody,
                replyTo: sender.email || undefined,
              });
            }
          } else {
            const resend = getResendClient();
            await resend.emails.send({
              from: `${sender.name} via Duely <reminders@duely.in>`,
              to: entity.email,
              subject,
              text: textBody,
              replyTo: sender.email || undefined,
            });
          }
          sent += 1;
          monthlyCountsMap.set(entity.organization_id, monthlySent + 1);
        } else {
          drafted += 1;
        }

        // Finalize and advance sequence
        const sentOrDraftedAt = new Date();
        let nextSequenceIndex = entity.sequence_index;
        let nextSendAt;

        if (entity.reminder_type === "sequence") {
          if (nextSequenceIndex < templates.length - 1) {
            nextSequenceIndex += 1;
            const nextOffset = templates[nextSequenceIndex].days_offset || 7;
            nextSendAt = computeRecurringReminderSendAt(nextOffset, sentOrDraftedAt);
          } else {
            await supabase
              .from(table)
              .update({
                last_sent_at: sentOrDraftedAt.toISOString(),
                active: false,
                sequence_index: nextSequenceIndex,
              })
              .eq("id", entity.id)
              .eq("next_send_at", leaseUntil);
            continue;
          }
        } else {
          nextSendAt = computeRecurringReminderSendAt(entity.reminder_frequency_days, sentOrDraftedAt);
        }

        await supabase
          .from(table)
          .update({
            last_sent_at: sentOrDraftedAt.toISOString(),
            next_send_at: nextSendAt,
            sequence_index: nextSequenceIndex,
          })
          .eq("id", entity.id)
          .eq("next_send_at", leaseUntil);

      } catch {
        failed += 1;
        await restoreClaim({ table, id: entity.id, leaseUntil, originalNextSendAt: entity.next_send_at });
      }
    }

    logger.cron({ job_name: "send_reminders", status: "end", processed: entities.length, success_count: sent + drafted, failure_count: failed, request_id: requestId });

    return { ok: true, processed: entities.length, claimed, sent, drafted, failed };
  }
);
