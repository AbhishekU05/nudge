"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeFirstReminderSendAt = computeFirstReminderSendAt;
exports.computeRecurringReminderSendAt = computeRecurringReminderSendAt;
const FIRST_REMINDER_DELAY_MS = 5 * 60 * 1000;
const MIN_REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;
function computeFirstReminderSendAt(from = new Date()) {
    return new Date(from.getTime() + FIRST_REMINDER_DELAY_MS).toISOString();
}
function computeRecurringReminderSendAt(reminderFrequencyDays, from = new Date()) {
    const requestedMs = reminderFrequencyDays * MIN_REMINDER_INTERVAL_MS;
    const ms = Math.max(MIN_REMINDER_INTERVAL_MS, requestedMs);
    return new Date(from.getTime() + ms).toISOString();
}
