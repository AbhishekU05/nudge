"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemainingBalance = getRemainingBalance;
exports.getDaysOverdue = getDaysOverdue;
exports.isEffectivelyPaid = isEffectivelyPaid;
// ---------------------------------------------------------------------------
// Derived Helpers
// ---------------------------------------------------------------------------
function getRemainingBalance(record) {
    const owed = Number(record.amount_owed ?? record.amount ?? 0);
    const paid = Number(record.amount_paid ?? 0);
    return Math.max(0, owed - paid);
}
// ---------------------------------------------------------------------------
// Derived Helpers (new schema)
function getDaysOverdue(invoice) {
    if (!invoice.due_date)
        return null;
    const [year, month, day] = invoice.due_date.split("-").map(Number);
    const due = new Date(year, month - 1, day); // local midnight
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
}
function isEffectivelyPaid(invoice) {
    return invoice.status === "paid" || invoice.status === "written_off";
}
