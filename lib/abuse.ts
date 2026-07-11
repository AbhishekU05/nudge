import "server-only";



type EventType = "reminder_create" | "reminder_toggle" | "reminder_delete" | "feedback_submit" | "external_sync_action";

const LIMITS: Record<EventType, { perMinute: number; perDay?: number }> = {
  reminder_create: { perMinute: 3, perDay: 25 },
  reminder_toggle: { perMinute: 10, perDay: 200 },
  reminder_delete: { perMinute: 10, perDay: 200 },
  feedback_submit: { perMinute: 2, perDay: 10 },
  // For actions with a real external side effect (Xero/QuickBooks push,
  // starting an Inngest workflow) - e.g. updateDueDate, enableAutomation,
  // saveAutomationSettings. Deliberately no daily cap: a user doing a full
  // day of legitimate work isn't the abuse case this guards against, only a
  // UI bug/double-click firing rapid repeated external calls is.
  external_sync_action: { perMinute: 10 },
};

function minutesAgo(n: number) {
  return new Date(Date.now() - n * 60 * 1000).toISOString();
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

export async function enforceRateLimit(userId: string, eventType: EventType) {
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const adminClient = createSupabaseAdminClient();

  const { data: member } = await adminClient
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .single();

  if (member) {
    await adminClient.from("usage_events").insert({
      user_id: userId,
      organization_id: member.organization_id,
      event_type: eventType,
    });
  }



  const limits = LIMITS[eventType];
  const perMinuteSince = minutesAgo(1);

  const { count: minuteCount } = await adminClient
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", eventType)
    .gte("created_at", perMinuteSince);

  if ((minuteCount ?? 0) > limits.perMinute) {
    throw new Error("Too many requests. Please wait a minute and try again.");
  }

  if (limits.perDay !== undefined) {
    const perDaySince = daysAgo(1);
    const { count: dayCount } = await adminClient
      .from("usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_type", eventType)
      .gte("created_at", perDaySince);

    if ((dayCount ?? 0) > limits.perDay) {
      throw new Error("Daily limit reached. Try again tomorrow.");
    }
  }
}

