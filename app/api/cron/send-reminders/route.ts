import crypto from "crypto";
import { NextResponse } from "next/server";

import { sendGmail, hasGmailTokens } from "@/lib/gmail";
import { getResendClient } from "@/lib/resend";
import { hasActiveSubscription } from "@/lib/payments";
import { computeRecurringReminderSendAt } from "@/lib/reminder-schedule";
import { getRequiredEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLAIM_WINDOW_MS = 5 * 60 * 1000;

type Template = { subject: string; body_html: string; days_offset?: number };

type DueEntity = {
  type: "client" | "invoice";
  id: string;
  user_id: string;
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
  customer_id?: string;
};

type ProfileRow = {
  user_id: string;
  razorpay_subscription_status: string | null;
  created_at: string;
};

function isAuthorized(request: Request) {
  const expected = getRequiredEnv("CRON_SECRET");

  const header = request.headers.get("authorization") || "";
  const expectedHeaderBuf = Buffer.from(`Bearer ${expected}`);
  const headerBuf = Buffer.from(header);

  if (headerBuf.length === expectedHeaderBuf.length && crypto.timingSafeEqual(headerBuf, expectedHeaderBuf)) {
    return true;
  }

  const key = new URL(request.url).searchParams.get("key") || "";
  const expectedKeyBuf = Buffer.from(expected);
  const keyBuf = Buffer.from(key);

  if (keyBuf.length === expectedKeyBuf.length && crypto.timingSafeEqual(keyBuf, expectedKeyBuf)) {
    return true;
  }

  return false;
}

async function claimEntity(params: { table: "clients" | "invoices"; id: string; nextSendAt: string; nowIso: string }) {
  const leaseUntil = new Date(Date.now() + CLAIM_WINDOW_MS).toISOString();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from(params.table)
    .update({ next_send_at: leaseUntil })
    .eq("id", params.id)
    .eq("active", true)
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

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  logger.cron({ job_name: "send_reminders", status: "start", request_id: requestId });

  if (!isAuthorized(request)) {
    logger.error({ message: "Unauthorized cron request", context: "cron:send_reminders", request_id: requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    .select("*")
    .eq("active", true)
    .neq("workflow_status", "paid")
    .lte("next_send_at", nowIso)
    .order("next_send_at", { ascending: true })
    .limit(30);

  const entities: DueEntity[] = [
    ...(clientsData || []).map((c) => ({
      type: "client" as const,
      id: c.id,
      user_id: c.user_id,
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
    })),
    ...(invoicesData || []).map((i) => ({
      type: "invoice" as const,
      id: i.id,
      user_id: i.user_id,
      recipient_name: i.recipient_name,
      email: i.recipient_email,
      reminder_type: i.reminder_type,
      reminder_templates: i.reminder_templates,
      sequence_index: i.sequence_index,
      reminder_frequency_days: i.reminder_frequency_days,
      next_send_at: i.next_send_at,
      last_sent_at: i.last_sent_at,
      active: i.active,
      auto_approve: i.auto_approve,
      invoice_number: i.invoice_number,
      amount_owed: i.amount_owed,
      currency: i.currency,
      customer_id: i.customer_id,
    }))
  ];

  if (entities.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  const userIds = [...new Set(entities.map((e) => e.user_id))];

  // Fetch subscriptions
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id,razorpay_subscription_status,created_at")
    .in("user_id", userIds)
    .returns<ProfileRow[]>();

  const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  // Fetch sender details
  const authUsersMap = new Map<string, { email: string | null; name: string }>();
  for (const uid of userIds) {
    const { data: { user } } = await supabase.auth.admin.getUserById(uid);
    if (user) {
      authUsersMap.set(uid, {
        email: user.email ?? null,
        name: user.user_metadata?.full_name || "Someone",
      });
    }
  }

  let claimed = 0;
  let sent = 0;
  let drafted = 0;
  let failed = 0;

  for (const entity of entities) {
    const profile = profileByUserId.get(entity.user_id);
    const subscriptionStatus = profile?.razorpay_subscription_status ?? null;
    const createdAt = profile?.created_at ?? null;

    if (!hasActiveSubscription(subscriptionStatus, createdAt)) {
      await supabase.from(entity.type === "client" ? "clients" : "invoices").update({ active: false }).eq("id", entity.id);
      continue;
    }

    const table = entity.type === "client" ? "clients" : "invoices";
    const leaseUntil = await claimEntity({ table, id: entity.id, nextSendAt: entity.next_send_at, nowIso });
    if (!leaseUntil) continue;

    claimed += 1;

    try {
      const sender = authUsersMap.get(entity.user_id);
      if (!sender || !entity.email || entity.email.trim() === "") {
        await supabase.from(table).update({ active: false }).eq("id", entity.id);
        failed += 1;
        continue;
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
          .eq("customer_id", entity.id)
          .neq("workflow_status", "paid")
          .order("due_date", { ascending: true });

        if (!invoices || invoices.length === 0) {
          await supabase.from("clients").update({ active: false }).eq("id", entity.id);
          continue;
        }

        const totalOwed = invoices.reduce((acc, inv) => acc + inv.amount_owed, 0);
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
          const amt = new Intl.NumberFormat("en-US", { style: "currency", currency: inv.currency || "USD" }).format(inv.amount_owed);
          return `- ${invName} (Due: ${due}): ${amt}`;
        }).join('\n');

        textBody = `${processed.body}\n\nOutstanding Invoices:\n${textList}`;

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
      }

      const status = entity.auto_approve ? "sent" : "draft";

      // Insert into email_drafts
      const { data: draftRecord, error: draftError } = await supabase
        .from("email_drafts")
        .insert({
          user_id: entity.user_id,
          client_id: entity.type === "client" ? entity.id : (entity.customer_id || entity.id),
          subject,
          body_html: textBody.replace(/\n/g, "<br>"), // Quick hack so it renders in the UI
          status,
          sent_at: status === "sent" ? new Date().toISOString() : null,
        })
        .select("id")
        .single();

      if (draftError || !draftRecord) {
        throw new Error(draftError?.message || "Failed to create draft");
      }

      // If auto-approve, send it right away
      if (entity.auto_approve) {
        const gmailAvailable = await hasGmailTokens(entity.user_id);
        if (gmailAvailable) {
          try {
            await sendGmail({
              userId: entity.user_id,
              senderName: sender.name,
              senderEmail: sender.email || "",
              to: entity.email,
              subject,
              body: textBody,
              html: false,
            });
          } catch (e) {
            // Fallback
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
          // Sequence is over, stop sending
          await supabase
            .from(table)
            .update({
              last_sent_at: sentOrDraftedAt.toISOString(),
              active: false,
              sequence_index: nextSequenceIndex,
            })
            .eq("id", entity.id)
            .eq("next_send_at", leaseUntil);
          continue; // Skip the normal update below
        }
      } else {
        // Recurring
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

    } catch (e) {
      failed += 1;
      await restoreClaim({ table, id: entity.id, leaseUntil, originalNextSendAt: entity.next_send_at });
    }
  }

  logger.cron({ job_name: "send_reminders", status: "end", processed: entities.length, success_count: sent + drafted, failure_count: failed, request_id: requestId });

  return NextResponse.json({ ok: true, processed: entities.length, claimed, sent, drafted, failed });
}

export async function GET(request: Request) {
  return POST(request);
}
