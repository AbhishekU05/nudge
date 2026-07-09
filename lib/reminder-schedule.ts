const FIRST_REMINDER_DELAY_MS = 5 * 60 * 1000;
const MIN_REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function computeFirstReminderSendAt(
  from = new Date(),
  dueDate?: string | null,
  offsetDays?: number
): string {
  if (dueDate) {
    const due = new Date(dueDate);
    let targetTime = due.getTime();
    
    if (offsetDays !== undefined) {
       targetTime += offsetDays * 24 * 60 * 60 * 1000;
    }
    
    // If target time is in the future, return that exact time
    if (targetTime > from.getTime()) {
       return new Date(targetTime).toISOString();
    }
    // If it's in the past (overdue/elapsed), fall through to send in 5 mins
  }

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
