export interface MockStore {
  currentUser: any;
  cookies: Map<string, { value: string; options?: any }>;
  redirects: string[];
  revalidatedPaths: { path: string; type?: string }[];
  database: { [table: string]: any[] };
  dbErrors: { [table: string]: any };
  supabaseAuthUsers: any[];
  history: any[];
  resendEmails: any[];
  gmailEmails: any[];
  xeroRevoked: boolean;
  quickbooksRevoked: boolean;
  xeroSynced: boolean;
  quickbooksSynced: boolean;
  syncResults: { imported: number; updated: number; markedPaid: number };
  signUpError: any;
  signInError: any;
  updateUserError: any;
  resetPasswordError: any;
  feedbackEmails: any[];
}

export const mockStore: MockStore = {
  currentUser: null,
  cookies: new Map(),
  redirects: [],
  revalidatedPaths: [],
  database: {},
  dbErrors: {},
  supabaseAuthUsers: [],
  history: [],
  resendEmails: [],
  gmailEmails: [],
  xeroRevoked: false,
  quickbooksRevoked: false,
  xeroSynced: false,
  quickbooksSynced: false,
  syncResults: { imported: 1, updated: 2, markedPaid: 3 },
  signUpError: null,
  signInError: null,
  updateUserError: null,
  resetPasswordError: null,
  feedbackEmails: [],
};

export function resetMockStore() {
  mockStore.currentUser = null;
  mockStore.cookies.clear();
  mockStore.redirects = [];
  mockStore.revalidatedPaths = [];
  mockStore.database = {
    profiles: [],
    clients: [],
    invoices: [],
    customer_events: [],
    email_drafts: [],
    integrations: [],
    late_fee_policies: [],
    usage_events: [],
    leads: [],
  };
  mockStore.dbErrors = {};
  mockStore.supabaseAuthUsers = [];
  mockStore.history = [];
  mockStore.resendEmails = [];
  mockStore.gmailEmails = [];
  mockStore.xeroRevoked = false;
  mockStore.quickbooksRevoked = false;
  mockStore.xeroSynced = false;
  mockStore.quickbooksSynced = false;
  mockStore.syncResults = { imported: 1, updated: 2, markedPaid: 3 };
  mockStore.signUpError = null;
  mockStore.signInError = null;
  mockStore.updateUserError = null;
  mockStore.resetPasswordError = null;
  mockStore.feedbackEmails = [];
}
