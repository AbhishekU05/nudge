/**
 * Subscription gate — checks whether an org has an active Dodo subscription.
 * Extra arguments are accepted for backward compatibility with frontend components
 * that call this with (status, createdAt, renewsAt). They are intentionally ignored.
 */
import type { SubscriptionStatus } from "@/lib/types";

export function hasActiveSubscription(
  status: SubscriptionStatus | string | null | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createdAt?: string | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  renewsAt?: string | null,
): boolean {
  if (!status) return false;
  return status === "active" || status === "on_hold";
}

export function getTrialDaysLeft(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createdAt?: string | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  status?: string | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  renewsAt?: string | null,
): number {
  return 0;
}
