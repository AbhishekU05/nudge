"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceRateLimit = enforceRateLimit;
require("server-only");
const server_1 = require("@/lib/supabase/server");
const LIMITS = {
    reminder_create: { perMinute: 3, perDay: 25 },
    reminder_toggle: { perMinute: 10, perDay: 200 },
    reminder_delete: { perMinute: 10, perDay: 200 },
    feedback_submit: { perMinute: 2, perDay: 10 },
};
function minutesAgo(n) {
    return new Date(Date.now() - n * 60 * 1000).toISOString();
}
function daysAgo(n) {
    return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}
async function enforceRateLimit(userId, eventType) {
    const supabase = await (0, server_1.createSupabaseServerClient)();
    await supabase.from("usage_events").insert({
        user_id: userId,
        event_type: eventType,
    });
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
    if ((minuteCount ?? 0) > limits.perMinute) {
        throw new Error("Too many requests. Please wait a minute and try again.");
    }
    if ((dayCount ?? 0) > limits.perDay) {
        throw new Error("Daily limit reached. Try again tomorrow.");
    }
}
