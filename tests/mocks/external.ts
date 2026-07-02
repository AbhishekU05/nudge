import { mockStore } from "./store";

// Xero mocks
export async function syncXeroInvoicesForUser(userId: string) {
  mockStore.xeroSynced = true;
  return mockStore.syncResults;
}

export async function revokeXeroIntegration(userId: string) {
  mockStore.xeroRevoked = true;
}

// QuickBooks mocks
export async function syncQuickBooksInvoicesForUser(userId: string) {
  mockStore.quickbooksSynced = true;
  return mockStore.syncResults;
}

export async function revokeQuickBooksIntegration(userId: string) {
  mockStore.quickbooksRevoked = true;
}

// Gmail mocks
export async function sendGmail(options: any) {
  mockStore.gmailEmails.push(options);
  return { success: true };
}

export async function hasGmailTokens(userId: string) {
  return true;
}

// Resend mocks
export function getResendClient() {
  return {
    emails: {
      send: async (options: any) => {
        mockStore.resendEmails.push(options);
        return { data: { id: "resend-mock-id" }, error: null };
      },
    },
  };
}

// Feedback mocks
export async function sendFeedbackEmail(options: any) {
  mockStore.feedbackEmails.push(options);
}
