"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockStore = void 0;
exports.resetMockStore = resetMockStore;
exports.mockStore = {
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
function resetMockStore() {
    exports.mockStore.currentUser = null;
    exports.mockStore.cookies.clear();
    exports.mockStore.redirects = [];
    exports.mockStore.revalidatedPaths = [];
    exports.mockStore.database = {
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
    exports.mockStore.dbErrors = {};
    exports.mockStore.supabaseAuthUsers = [];
    exports.mockStore.history = [];
    exports.mockStore.resendEmails = [];
    exports.mockStore.gmailEmails = [];
    exports.mockStore.xeroRevoked = false;
    exports.mockStore.quickbooksRevoked = false;
    exports.mockStore.xeroSynced = false;
    exports.mockStore.quickbooksSynced = false;
    exports.mockStore.syncResults = { imported: 1, updated: 2, markedPaid: 3 };
    exports.mockStore.signUpError = null;
    exports.mockStore.signInError = null;
    exports.mockStore.updateUserError = null;
    exports.mockStore.resetPasswordError = null;
    exports.mockStore.feedbackEmails = [];
}
