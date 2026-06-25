// ./lib/payments.ts

export function hasActiveSubscription(
  status: string | null | undefined,
  createdAt?: string | null,
  renewsAt?: string | null,
) {
  if (status === "active") return true;
  
  if (status === "waitlist" && renewsAt) {
    if (Date.now() < new Date(renewsAt).getTime()) return true;
  }

  // If they have a Razorpay status other than "none" or "waitlist", 
  // they've already subscribed once, so the free trial is voided.
  if (status && status !== "none" && status !== "waitlist") return false;

  if (createdAt && status !== "waitlist") {
    const trialDays = 7;
    const trialEndMs = new Date(createdAt).getTime() + (trialDays * 24 * 60 * 60 * 1000);

    if (Date.now() < trialEndMs) return true;
  }

  return false;
}

export function getTrialDaysLeft(createdAt?: string | null, status?: string | null, renewsAt?: string | null) {
  if (status === "waitlist" && renewsAt) {
    return Math.max(
      0,
      Math.ceil((new Date(renewsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
  }

  if (!createdAt) return 0;

  const trialDays = 7;
  const trialEndMs = new Date(createdAt).getTime() + (trialDays * 24 * 60 * 60 * 1000);

  return Math.max(
    0,
    Math.ceil((trialEndMs - Date.now()) / (1000 * 60 * 60 * 24)),
  );
}
