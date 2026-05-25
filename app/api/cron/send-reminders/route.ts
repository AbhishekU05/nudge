/*
 * This manages the cron requests from cron-job.org
 */

import crypto from "crypto";
import { NextResponse } from "next/server";

import { sendReminderEmail } from "@/lib/email/send-reminder";
import { hasActiveSubscription } from "@/lib/payments";
import {
  computeFirstReminderSendAt,
  computeRecurringReminderSendAt,
} from "@/lib/reminder-schedule";
import { getRequiredEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLAIM_WINDOW_MS = 5 * 60 * 1000;

// describes reminder object
type DueReminder = {
  id: string;
  user_id: string;
  recipient_name: string;
  recipient_email: string;
  amount_owed: number;
  currency: string;
  custom_message: string | null;
  email_subject: string | null;
  payment_link: string | null;
  reminder_frequency_days: number;
  unsubscribe_token: string;
  next_send_at: string;
  last_sent_at: string | null;
  updated_at: string;
  created_at: string;
};

type ProfileRow = {
  user_id: string;
  razorpay_subscription_status: string | null;
  created_at: string;
};

// Check if api request is authorized or not
function isAuthorized(request: Request) {
  const expected = getRequiredEnv("CRON_SECRET");

  // Header auth (future)
  const header = request.headers.get("authorization") || "";
  const expectedHeaderBuf = Buffer.from(`Bearer ${expected}`);
  const headerBuf = Buffer.from(header);

  if (headerBuf.length === expectedHeaderBuf.length && crypto.timingSafeEqual(headerBuf, expectedHeaderBuf)) {
    return true;
  }

  // Query param auth (cron-job)
  const key = new URL(request.url).searchParams.get("key") || "";
  const expectedKeyBuf = Buffer.from(expected);
  const keyBuf = Buffer.from(key);

  if (keyBuf.length === expectedKeyBuf.length && crypto.timingSafeEqual(keyBuf, expectedKeyBuf)) {
    return true;
  }

  return false;
}

// Sets a kind of mutex on the database and tries to change the row
async function claimReminder(params: {
  reminder: DueReminder;
  nowIso: string;
}) {
  const leaseUntil = new Date(Date.now() + CLAIM_WINDOW_MS).toISOString();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("customers")
    .update({ next_send_at: leaseUntil })
    .eq("id", params.reminder.id)
    .eq("active", true)
    .eq("unsubscribed", false)
    .eq("next_send_at", params.reminder.next_send_at)
    .eq("updated_at", params.reminder.updated_at)
    .lte("next_send_at", params.nowIso)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return leaseUntil;
}

// Again puts a mutex on the database and modifies the first send time
async function deferFirstReminder(params: {
  reminderId: string;
  currentNextSendAt: string;
  currentUpdatedAt: string;
  deferredUntil: string;
}) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("customers")
    .update({ next_send_at: params.deferredUntil })
    .eq("id", params.reminderId)
    .eq("active", true)
    .eq("unsubscribed", false)
    .eq("next_send_at", params.currentNextSendAt)
    .eq("updated_at", params.currentUpdatedAt)
    .is("last_sent_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

// Restores db if mutex previously set fails
async function restoreClaim(params: {
  reminderId: string;
  leaseUntil: string;
  originalNextSendAt: string;
}) {
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("customers")
    .update({ next_send_at: params.originalNextSendAt })
    .eq("id", params.reminderId)
    .eq("next_send_at", params.leaseUntil);
}

// Update database after sending reminder
async function finalizeReminderSend(params: {
  reminderId: string;
  leaseUntil: string;
  lastSentAt: string;
  nextSendAt: string;
}) {
  const supabase = createSupabaseAdminClient();

  const update = await supabase
    .from("customers")
    .update({
      last_sent_at: params.lastSentAt,
      next_send_at: params.nextSendAt,
    })
    .eq("id", params.reminderId)
    .eq("next_send_at", params.leaseUntil);

  if (!update.error) {
    return;
  }

  const fallback = await supabase
    .from("customers")
    .update({
      last_sent_at: params.lastSentAt,
      next_send_at: params.nextSendAt,
    })
    .eq("id", params.reminderId);

  if (fallback.error) {
    throw new Error(fallback.error.message);
  }
}

// Actual function executed by cron job
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  logger.cron({
    job_name: "send_reminders",
    status: "start",
    request_id: requestId,
  });

  if (!isAuthorized(request)) {
    logger.error({
      message: "Unauthorized cron request",
      context: "cron:send_reminders",
      request_id: requestId,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id,user_id,recipient_name,recipient_email,amount_owed,currency,email_subject,custom_message,payment_link,reminder_frequency_days,unsubscribe_token,next_send_at,last_sent_at,updated_at,created_at",
    )
    .eq("active", true)
    .eq("unsubscribed", false)
    .lte("next_send_at", nowIso)
    .order("next_send_at", { ascending: true })
    .limit(50)
    .returns<DueReminder[]>();

  if (error) {
    logger.cron({
      job_name: "send_reminders",
      status: "error",
      error: error.message,
      request_id: requestId,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reminders = data ?? [];
  const userIds = [...new Set(reminders.map((reminder) => reminder.user_id))];
  const { data: profiles, error: profileError } = userIds.length
    ? await supabase
        .from("profiles")
        .select("user_id,razorpay_subscription_status,created_at")
        .in("user_id", userIds)
        .returns<ProfileRow[]>()
    : { data: [], error: null };

  if (profileError) {
    logger.cron({
      job_name: "send_reminders",
      status: "error",
      error: profileError.message,
      request_id: requestId,
    });
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const profileByUserId = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile]),
  );

  const authUsersMap = new Map<
    string,
    { email: string | null; name: string }
  >();
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
  let failed = 0;
  let skippedNoSubscription = 0;

  for (const reminder of reminders) {
    const profile = profileByUserId.get(reminder.user_id);
    const subscriptionStatus = profile?.razorpay_subscription_status ?? null;
    const createdAt = profile?.created_at ?? null;

    if (!hasActiveSubscription(subscriptionStatus, createdAt)) {
      skippedNoSubscription += 1;
      
      // Physically pause active reminders since their trial/subscription expired
      await supabase
        .from("customers")
        .update({ active: false })
        .eq("user_id", reminder.user_id)
        .eq("active", true);
        
      continue;
    }

    let leaseUntil: string | null = null;

    try {
      if (!reminder.last_sent_at) {
        const firstSendAt = computeFirstReminderSendAt(
          new Date(reminder.created_at),
        );

        if (firstSendAt > reminder.next_send_at && firstSendAt > nowIso) {
          await deferFirstReminder({
            reminderId: reminder.id,
            currentNextSendAt: reminder.next_send_at,
            currentUpdatedAt: reminder.updated_at,
            deferredUntil: firstSendAt,
          });
          continue;
        }
      }

      leaseUntil = await claimReminder({ reminder, nowIso });
      if (!leaseUntil) {
        continue;
      }

      claimed += 1;

      const sender = authUsersMap.get(reminder.user_id);
      if (!sender?.email) {
        // Can't send via Gmail without the user's email address
        failed += 1;
        continue;
      }

      await sendReminderEmail({
        userId: reminder.user_id,
        senderName: sender.name,
        senderEmail: sender.email,
        recipientEmail: reminder.recipient_email,
        recipientName: reminder.recipient_name,
        emailSubject: reminder.email_subject,
        customMessage: reminder.custom_message,
        paymentLink: reminder.payment_link,
      });

      const sentAt = new Date();
      await finalizeReminderSend({
        reminderId: reminder.id,
        leaseUntil,
        lastSentAt: sentAt.toISOString(),
        nextSendAt: computeRecurringReminderSendAt(
          reminder.reminder_frequency_days,
          sentAt,
        ),
      });

      sent += 1;
    } catch {
      failed += 1;

      if (leaseUntil) {
        await restoreClaim({
          reminderId: reminder.id,
          leaseUntil,
          originalNextSendAt: reminder.next_send_at,
        });
      }
    }
  }

  logger.cron({
    job_name: "send_reminders",
    status: "end",
    processed: reminders.length,
    success_count: sent,
    failure_count: failed,
    request_id: requestId,
  });

  return NextResponse.json({
    ok: true,
    processed: reminders.length,
    claimed,
    sent,
    failed,
    skippedNoSubscription,
  });
}

// Function called by cron job
export async function GET(request: Request) {
  return POST(request);
}
