// ./lib/payments.ts

export function hasActiveSubscription(
  status: string | null | undefined,
  createdAt?: string | null,
) {
  if (status === "active") return true;

  // keep your trial logic unchanged
  if (createdAt) {
    const trialDays = 14;
    const trialEnd = new Date(createdAt);
    trialEnd.setDate(trialEnd.getDate() + trialDays);

    if (new Date() < trialEnd) return true;
  }

  return false;
}

export function getTrialDaysLeft(createdAt?: string | null) {
  if (!createdAt) return 0;

  const trialEnd = new Date(createdAt);
  trialEnd.setDate(trialEnd.getDate() + 14);

  return Math.max(
    0,
    Math.ceil(
      (trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
}
