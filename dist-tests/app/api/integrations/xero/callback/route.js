"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = exports.runtime = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const xero_1 = require("@/lib/xero");
const reminder_1 = require("@/lib/email/reminder");
const logger_1 = require("@/lib/logger");
exports.runtime = "nodejs";
exports.dynamic = "force-dynamic";
function redirectToSettings(key, message) {
    const url = new URL("/settings/integrations", (0, reminder_1.getAppUrl)());
    url.searchParams.set(key, message);
    return server_1.NextResponse.redirect(url);
}
async function GET(request) {
    const requestUrl = new URL(request.url);
    const oauthError = requestUrl.searchParams.get("error_description")
        ?? requestUrl.searchParams.get("error");
    const state = requestUrl.searchParams.get("state");
    if (oauthError) {
        return redirectToSettings("error", oauthError);
    }
    if (!state) {
        return redirectToSettings("error", "Missing Xero OAuth state.");
    }
    try {
        const result = await (0, xero_1.completeXeroOAuthCallback)(request.url, state);
        const url = new URL("/settings/integrations/xero/bank", (0, reminder_1.getAppUrl)());
        url.searchParams.set("success", `Xero connected. Imported ${result.imported} invoices and updated ${result.updated + result.markedPaid}.`);
        return server_1.NextResponse.redirect(url);
    }
    catch (error) {
        logger_1.logger.error({
            message: "Xero OAuth callback failed",
            context: "xero:callback",
            error: error instanceof Error ? error.message : "Unknown error",
        });
        return redirectToSettings("error", error instanceof Error ? error.message : "Unable to connect Xero.");
    }
}
