const FIRST_REMINDER_DELAY_MS = 30 * 60 * 1000;
const MIN_REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function computeFirstReminderSendAt(from = new Date()): string {
  return new Date(from.getTime() + FIRST_REMINDER_DELAY_MS).toISOString();
}

export function computeRecurringReminderSendAt(
  reminderFrequencyDays: number,
  from = new Date(),
): string {
  const requestedMs = reminderFrequencyDays * MIN_REMINDER_INTERVAL_MS;
  const ms = Math.max(MIN_REMINDER_INTERVAL_MS, requestedMs);
  return new Date(from.getTime() + ms).toISOString();
}
