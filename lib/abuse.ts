import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type EventType = "reminder_create" | "reminder_toggle" | "reminder_delete";

const LIMITS: Record<EventType, { perMinute: number; perDay: number }> = {
  reminder_create: { perMinute: 3, perDay: 25 },
  reminder_toggle: { perMinute: 10, perDay: 200 },
  reminder_delete: { perMinute: 10, perDay: 200 },
};

function minutesAgo(n: number) {
  return new Date(Date.now() - n * 60 * 1000).toISOString();
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

export async function enforceRateLimit(userId: string, eventType: EventType) {
  const supabase = await createSupabaseServerClient();

  const perMinuteSince = minutesAgo(1);
  const perDaySince = daysAgo(1);
  const limits = LIMITS[eventType];

  const [{ count: minuteCount }, { count: dayCount }] = await Promise.all([
    supabase
      .from("usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_type", eventType)
      .gte("created_at", perMinuteSince),
    supabase
      .from("usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_type", eventType)
      .gte("created_at", perDaySince),
  ]);

  if ((minuteCount ?? 0) >= limits.perMinute) {
    throw new Error("Too many requests. Please wait a minute and try again.");
  }
  if ((dayCount ?? 0) >= limits.perDay) {
    throw new Error("Daily limit reached. Try again tomorrow.");
  }
}

export async function recordUsageEvent(userId: string, eventType: EventType) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("usage_events").insert({
    user_id: userId,
    event_type: eventType,
  });
}

