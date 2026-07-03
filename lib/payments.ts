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
  if (!createdAt) return 0;
  if (status === "active" || status === "on_hold") return 0; // If subscribed, trial is over/irrelevant
  
  const trialDays = 14; // Typical trial length, adjust if needed
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const daysLeft = trialDays - diffDays;
  return daysLeft > 0 ? daysLeft : 0;
}

export function isAutomationAndIntegrationAllowed(
  status: SubscriptionStatus | string | null | undefined,
  createdAt?: string | null
): boolean {
  const hasSub = hasActiveSubscription(status as SubscriptionStatus);
  if (hasSub) return true; // Allowed if they have a subscription
  
  // If no subscription is active, and trial is active, DISALLOW. 
  // Wait, the user said "if the trial is active and no subscription is active, then disallow all integrations and payment reminder automation".
  // This means if they are in trial, they CANNOT use these features.
  // What if trial is NOT active (i.e. trial ended) and no subscription? 
  // Normally, nothing is allowed if trial ended and no subscription.
  // So basically, these features require a PAID subscription!
  return false;
}
