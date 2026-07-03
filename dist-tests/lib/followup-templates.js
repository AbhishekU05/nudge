"use strict";
/*
 * Follow-up email draft templates.
 * Kept in a plain lib file (not a server action) so they can be imported
 * by both client components and server code without violating the
 * "use server" constraint.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FOLLOWUP_TEMPLATES = void 0;
exports.FOLLOWUP_TEMPLATES = {
    friendly: (name, amount, days) => `Hi ${name},\n\nI hope you're doing well! I just wanted to send a quick, friendly reminder that we have an outstanding balance of ${amount} on your account${days ? ` (${days} day${days === 1 ? "" : "s"} overdue)` : ""}.\n\nIf you've already arranged payment, please disregard this message. Otherwise, whenever you're ready — no rush!\n\nThanks so much,`,
    professional: (name, amount, days) => `Dear ${name},\n\nI'm following up regarding an outstanding balance of ${amount} on your account${days ? `, which is currently ${days} day${days === 1 ? "" : "s"} past due` : ""}.\n\nPlease let me know if you have any questions, or if there's anything I can do to help facilitate payment.\n\nKind regards,`,
    firm: (name, amount, days) => `Dear ${name},\n\nThis is a follow-up regarding an overdue balance of ${amount}${days ? ` — now ${days} day${days === 1 ? "" : "s"} past due` : ""}. Prompt payment is required to avoid further escalation.\n\nPlease arrange payment at your earliest convenience and confirm via reply.\n\nRegards,`,
};
