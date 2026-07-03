"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasActiveSubscription = hasActiveSubscription;
exports.getTrialDaysLeft = getTrialDaysLeft;
exports.isAutomationAndIntegrationAllowed = isAutomationAndIntegrationAllowed;
function hasActiveSubscription(status, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
createdAt, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
renewsAt) {
    if (!status)
        return false;
    return status === "active" || status === "on_hold";
}
function getTrialDaysLeft(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
createdAt, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
status, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
renewsAt) {
    if (!createdAt)
        return 0;
    if (status === "active" || status === "on_hold")
        return 0; // If subscribed, trial is over/irrelevant
    const trialDays = 14; // Typical trial length, adjust if needed
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysLeft = trialDays - diffDays;
    return daysLeft > 0 ? daysLeft : 0;
}
function isAutomationAndIntegrationAllowed(status, createdAt) {
    const hasSub = hasActiveSubscription(status);
    if (hasSub)
        return true; // Allowed if they have a subscription
    // If no subscription is active, and trial is active, DISALLOW. 
    // Wait, the user said "if the trial is active and no subscription is active, then disallow all integrations and payment reminder automation".
    // This means if they are in trial, they CANNOT use these features.
    // What if trial is NOT active (i.e. trial ended) and no subscription? 
    // Normally, nothing is allowed if trial ended and no subscription.
    // So basically, these features require a PAID subscription!
    return false;
}
