import { NextResponse } from "next/server";

import { sendReminderEmail } from "@/lib/email/send-reminder";
import { hasActiveSubscription } from "@/lib/lemon";
import {
  computeFirstReminderSendAt,
  computeRecurringReminderSendAt,
} from "@/lib/reminder-schedule";
import { getRequiredEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLAIM_WINDOW_MS = 5 * 60 * 1000;

type DueReminder = {
  id: string;
  user_id: string;
  recipient_name: string;
  recipient_email: string;
  amount_owed: number;
  custom_message: string | null;
  reminder_frequency_days: number;
  unsubscribe_token: string;
  next_send_at: string;
  last_sent_at: string | null;
  updated_at: string;
};

type ProfileRow = {
  user_id: string;
  lemon_subscription_status: string | null;
  created_at: string;
};

function isAuthorized(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const expected = getRequiredEnv("CRON_SECRET");
  return header === `Bearer ${expected}`;
}

async function claimReminder(params: {
  reminder: DueReminder;
  nowIso: string;
}) {
  const leaseUntil = new Date(Date.now() + CLAIM_WINDOW_MS).toISOString();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("reminders")
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

async function deferFirstReminder(params: {
  reminderId: string;
  currentNextSendAt: string;
  currentUpdatedAt: string;
  deferredUntil: string;
}) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("reminders")
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

async function restoreClaim(params: {
  reminderId: string;
  leaseUntil: string;
  originalNextSendAt: string;
}) {
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("reminders")
    .update({ next_send_at: params.originalNextSendAt })
    .eq("id", params.reminderId)
    .eq("next_send_at", params.leaseUntil);
}

async function finalizeReminderSend(params: {
  reminderId: string;
  leaseUntil: string;
  lastSentAt: string;
  nextSendAt: string;
}) {
  const supabase = createSupabaseAdminClient();

  const update = await supabase
    .from("reminders")
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
    .from("reminders")
    .update({
      last_sent_at: params.lastSentAt,
      next_send_at: params.nextSendAt,
    })
    .eq("id", params.reminderId);

  if (fallback.error) {
    throw new Error(fallback.error.message);
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("reminders")
    .select(
      "id,user_id,recipient_name,recipient_email,amount_owed,custom_message,reminder_frequency_days,unsubscribe_token,next_send_at,last_sent_at,updated_at",
    )
    .eq("active", true)
    .eq("unsubscribed", false)
    .lte("next_send_at", nowIso)
    .order("next_send_at", { ascending: true })
    .limit(50)
    .returns<DueReminder[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reminders = data ?? [];
  const userIds = [...new Set(reminders.map((reminder) => reminder.user_id))];
  const { data: profiles, error: profileError } = userIds.length
    ? await supabase
        .from("profiles")
        .select("user_id,lemon_subscription_status,created_at")
        .in("user_id", userIds)
        .returns<ProfileRow[]>()
    : { data: [], error: null };

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const profileByUserId = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile]),
  );

  const authUsersMap = new Map();
  for (const uid of userIds) {
    const { data: { user } } = await supabase.auth.admin.getUserById(uid);
    if (user) {
      authUsersMap.set(uid, user.user_metadata?.full_name || "Someone");
    }
  }

  let claimed = 0;
  let sent = 0;
  let failed = 0;
  let skippedNoSubscription = 0;

  for (const reminder of reminders) {
    const profile = profileByUserId.get(reminder.user_id);
    const subscriptionStatus = profile?.lemon_subscription_status ?? null;
    const createdAt = profile?.created_at ?? null;

    if (!hasActiveSubscription(subscriptionStatus, createdAt)) {
      skippedNoSubscription += 1;
      continue;
    }

    let leaseUntil: string | null = null;

    try {
      if (!reminder.last_sent_at) {
        const firstSendAt = computeFirstReminderSendAt(
          new Date(reminder.updated_at),
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

      const senderName = authUsersMap.get(reminder.user_id) || "Someone";
      await sendReminderEmail({
        senderName,
        recipientEmail: reminder.recipient_email,
        recipientName: reminder.recipient_name,
        amountOwed: Number(reminder.amount_owed),
        customMessage: reminder.custom_message,
        unsubscribeToken: reminder.unsubscribe_token,
        idempotencyKey: `reminder:${reminder.id}:${reminder.next_send_at}`,
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

  return NextResponse.json({
    ok: true,
    processed: reminders.length,
    claimed,
    sent,
    failed,
    skippedNoSubscription,
  });
}
