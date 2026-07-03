"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUT = exports.POST = exports.GET = void 0;
const next_1 = require("inngest/next");
const client_1 = require("@/lib/inngest/client");
const apply_late_fees_1 = require("@/lib/inngest/functions/apply-late-fees");
const send_digest_1 = require("@/lib/inngest/functions/send-digest");
const send_reminders_1 = require("@/lib/inngest/functions/send-reminders");
const sync_quickbooks_1 = require("@/lib/inngest/functions/sync-quickbooks");
const sync_xero_1 = require("@/lib/inngest/functions/sync-xero");
_a = (0, next_1.serve)({
    client: client_1.inngest,
    functions: [
        apply_late_fees_1.applyLateFees,
        send_digest_1.sendDigest,
        send_reminders_1.sendReminders,
        sync_quickbooks_1.syncQuickBooks,
        sync_xero_1.syncXero,
    ],
}), exports.GET = _a.GET, exports.POST = _a.POST, exports.PUT = _a.PUT;
