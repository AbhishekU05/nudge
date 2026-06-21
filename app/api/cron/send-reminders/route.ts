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

type DueClient = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  reminder_frequency_days: number;
  unsubscribe_token: string;
  next_send_at: string;
  last_sent_at: string | null;
  active: boolean;
  auto_approve: boolean;
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

async function claimClient(params: { client: DueClient; nowIso: string }) {
  const leaseUntil = new Date(Date.now() + CLAIM_WINDOW_MS).toISOString();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("clients")
    .update({ next_send_at: leaseUntil })
    .eq("id", params.client.id)
    .eq("active", true)
    .eq("unsubscribed", false)
    .eq("next_send_at", params.client.next_send_at)
    .lte("next_send_at", params.nowIso)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !data) return null;
  return leaseUntil;
}

async function restoreClaim(params: { clientId: string; leaseUntil: string; originalNextSendAt: string }) {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("clients")
    .update({ next_send_at: params.originalNextSendAt })
    .eq("id", params.clientId)
    .eq("next_send_at", params.leaseUntil);
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
  const { data: clientsData, error: clientsError } = await supabase
    .from("clients")
    .select("id, user_id, name, email, reminder_frequency_days, unsubscribe_token, next_send_at, last_sent_at, active, auto_approve")
    .eq("active", true)
    .eq("unsubscribed", false)
    .lte("next_send_at", nowIso)
    .order("next_send_at", { ascending: true })
    .limit(50)
    .returns<DueClient[]>();

  if (clientsError) {
    logger.cron({ job_name: "send_reminders", status: "error", error: clientsError.message, request_id: requestId });
    return NextResponse.json({ error: clientsError.message }, { status: 500 });
  }

  const clients = clientsData ?? [];
  const userIds = [...new Set(clients.map((c) => c.user_id))];

  // 2. Fetch subscriptions
  const { data: profiles, error: profileError } = userIds.length
    ? await supabase
        .from("profiles")
        .select("user_id,razorpay_subscription_status,created_at")
        .in("user_id", userIds)
        .returns<ProfileRow[]>()
    : { data: [], error: null };

  if (profileError) {
    logger.cron({ job_name: "send_reminders", status: "error", error: profileError.message, request_id: requestId });
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  // 3. Fetch sender details
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
  let skippedNoSubscription = 0;
  let skippedNoInvoices = 0;

  for (const client of clients) {
    const profile = profileByUserId.get(client.user_id);
    const subscriptionStatus = profile?.razorpay_subscription_status ?? null;
    const createdAt = profile?.created_at ?? null;

    if (!hasActiveSubscription(subscriptionStatus, createdAt)) {
      skippedNoSubscription += 1;
      await supabase.from("clients").update({ active: false }).eq("user_id", client.user_id).eq("active", true);
      continue;
    }

    const leaseUntil = await claimClient({ client, nowIso });
    if (!leaseUntil) continue;

    claimed += 1;

    try {
      // Fetch outstanding invoices for this client
      const { data: invoices, error: invError } = await supabase
        .from("invoices")
        .select("id, invoice_number, amount_owed, currency, due_date")
        .eq("customer_id", client.id)
        .neq("workflow_status", "paid")
        .order("due_date", { ascending: true });

      if (invError || !invoices || invoices.length === 0) {
        skippedNoInvoices += 1;
        await supabase
          .from("clients")
          .update({
            next_send_at: computeRecurringReminderSendAt(client.reminder_frequency_days, new Date()),
          })
          .eq("id", client.id)
          .eq("next_send_at", leaseUntil);
        continue;
      }

      const sender = authUsersMap.get(client.user_id);
      if (!sender || !client.email || client.email.trim() === "") {
        await supabase.from("clients").update({ active: false }).eq("id", client.id);
        failed += 1;
        continue;
      }

      // Generate HTML Body
      const totalOwed = invoices.reduce((acc, inv) => acc + inv.amount_owed, 0);
      const currency = invoices[0]?.currency || "USD";
      const totalFormatted = new Intl.NumberFormat("en-US", { style: "currency", currency }).format(totalOwed);

      const htmlBody = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.5;">
          <h2 style="color: #111; margin-bottom: 24px;">Account Statement</h2>
          <p>Hi ${client.name},</p>
          <p>This is a reminder from ${sender.name} that your account has an outstanding balance of <strong>${totalFormatted}</strong>.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 24px; margin-bottom: 24px;">
            <thead>
              <tr style="border-bottom: 1px solid #eee; text-align: left;">
                <th style="padding: 12px 8px; font-weight: 600; color: #555;">Invoice #</th>
                <th style="padding: 12px 8px; font-weight: 600; color: #555;">Due Date</th>
                <th style="padding: 12px 8px; font-weight: 600; color: #555; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(inv => `
                <tr style="border-bottom: 1px solid #f9f9f9;">
                  <td style="padding: 12px 8px; color: #444;">${inv.invoice_number || "Invoice"}</td>
                  <td style="padding: 12px 8px; color: #444;">${inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'Upon receipt'}</td>
                  <td style="padding: 12px 8px; text-align: right; color: #111; font-weight: 500;">
                    ${new Intl.NumberFormat("en-US", { style: "currency", currency: inv.currency || "USD" }).format(inv.amount_owed)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <p style="margin-top: 32px;">Please process payment at your earliest convenience.</p>
          <p>Best,<br/>${sender.name}</p>
        </div>
      `;

      const subject = `Account Statement - ${sender.name}`;
      const status = client.auto_approve ? "sent" : "draft";

      // Insert into email_drafts
      const { data: draftRecord, error: draftError } = await supabase
        .from("email_drafts")
        .insert({
          user_id: client.user_id,
          client_id: client.id,
          subject,
          body_html: htmlBody,
          status,
          sent_at: status === "sent" ? new Date().toISOString() : null,
        })
        .select("id")
        .single();

      if (draftError || !draftRecord) {
        throw new Error(draftError?.message || "Failed to create draft");
      }

      // If auto-approve, send it right away
      if (client.auto_approve) {
        const gmailAvailable = await hasGmailTokens(client.user_id);
        if (gmailAvailable) {
          try {
            await sendGmail({
              userId: client.user_id,
              senderName: sender.name,
              senderEmail: sender.email || "",
              to: client.email,
              subject,
              body: htmlBody,
              html: true,
            });
          } catch (e) {
            // Fallback
            const resend = getResendClient();
            await resend.emails.send({
              from: `${sender.name} via Duely <reminders@duely.in>`,
              to: client.email,
              subject,
              html: htmlBody,
              replyTo: sender.email || undefined,
            });
          }
        } else {
          const resend = getResendClient();
          await resend.emails.send({
            from: `${sender.name} via Duely <reminders@duely.in>`,
            to: client.email,
            subject,
            html: htmlBody,
            replyTo: sender.email || undefined,
          });
        }
        sent += 1;
      } else {
        drafted += 1;
      }

      // Finalize client
      const sentOrDraftedAt = new Date();
      await supabase
        .from("clients")
        .update({
          last_sent_at: sentOrDraftedAt.toISOString(),
          next_send_at: computeRecurringReminderSendAt(client.reminder_frequency_days, sentOrDraftedAt),
        })
        .eq("id", client.id)
        .eq("next_send_at", leaseUntil);

    } catch (e) {
      failed += 1;
      await restoreClaim({ clientId: client.id, leaseUntil, originalNextSendAt: client.next_send_at });
    }
  }

  logger.cron({ job_name: "send_reminders", status: "end", processed: clients.length, success_count: sent + drafted, failure_count: failed, request_id: requestId });

  return NextResponse.json({ ok: true, processed: clients.length, claimed, sent, drafted, failed, skippedNoSubscription, skippedNoInvoices });
}

export async function GET(request: Request) {
  return POST(request);
}
