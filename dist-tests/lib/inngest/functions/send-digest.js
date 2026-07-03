"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDigest = void 0;
const client_1 = require("@/lib/inngest/client");
const send_digest_1 = require("@/lib/email/send-digest");
exports.sendDigest = client_1.inngest.createFunction({ id: "send-digest", triggers: [{ cron: "0 8 * * 1" }] }, async ({ step }) => {
    const result = await (0, send_digest_1.sendWeeklyDigestEmails)();
    if (!result.success) {
        throw result.error || new Error("Failed to send digest");
    }
    return result;
});
