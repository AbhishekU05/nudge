"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncXeroInvoicesForUser = syncXeroInvoicesForUser;
exports.revokeXeroIntegration = revokeXeroIntegration;
exports.syncQuickBooksInvoicesForUser = syncQuickBooksInvoicesForUser;
exports.revokeQuickBooksIntegration = revokeQuickBooksIntegration;
exports.sendGmail = sendGmail;
exports.hasGmailTokens = hasGmailTokens;
exports.getResendClient = getResendClient;
exports.sendFeedbackEmail = sendFeedbackEmail;
const store_1 = require("./store");
// Xero mocks
async function syncXeroInvoicesForUser(userId) {
    store_1.mockStore.xeroSynced = true;
    return store_1.mockStore.syncResults;
}
async function revokeXeroIntegration(userId) {
    store_1.mockStore.xeroRevoked = true;
}
// QuickBooks mocks
async function syncQuickBooksInvoicesForUser(userId) {
    store_1.mockStore.quickbooksSynced = true;
    return store_1.mockStore.syncResults;
}
async function revokeQuickBooksIntegration(userId) {
    store_1.mockStore.quickbooksRevoked = true;
}
// Gmail mocks
async function sendGmail(options) {
    store_1.mockStore.gmailEmails.push(options);
    return { success: true };
}
async function hasGmailTokens(userId) {
    return true;
}
// Resend mocks
function getResendClient() {
    return {
        emails: {
            send: async (options) => {
                store_1.mockStore.resendEmails.push(options);
                return { data: { id: "resend-mock-id" }, error: null };
            },
        },
    };
}
// Feedback mocks
async function sendFeedbackEmail(options) {
    store_1.mockStore.feedbackEmails.push(options);
}
