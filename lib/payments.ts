// ./lib/payments.ts

export function hasActiveSubscription(
  status: string | null | undefined,
  createdAt?: string | null,
) {
  if (status === "active") return true;
  
  // If they have a Razorpay status other than "none" or "waitlist", 
  // they've already subscribed once, so the free trial is voided.
  if (status && status !== "none" && status !== "waitlist") return false;

  if (createdAt) {
    const isWaitlist = status === "waitlist";
    const trialDays = isWaitlist ? 44 : 14;
    const trialEndMs = new Date(createdAt).getTime() + (trialDays * 24 * 60 * 60 * 1000);

    if (Date.now() < trialEndMs) return true;
  }

  return false;
}

export function getTrialDaysLeft(createdAt?: string | null, status?: string | null) {
  if (!createdAt) return 0;

  const isWaitlist = status === "waitlist";
  const trialDays = isWaitlist ? 44 : 14;
  const trialEndMs = new Date(createdAt).getTime() + (trialDays * 24 * 60 * 60 * 1000);

  return Math.max(
    0,
    Math.ceil((trialEndMs - Date.now()) / (1000 * 60 * 60 * 24)),
  );
}
