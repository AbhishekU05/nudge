"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = exports.runtime = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const quickbooks_1 = require("@/lib/quickbooks");
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
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const realmId = request.nextUrl.searchParams.get("realmId");
    const errorParam = request.nextUrl.searchParams.get("error");
    if (errorParam) {
        logger_1.logger.external({
            service: "QuickBooks",
            action: "oauth_callback",
            success: false,
            error: errorParam,
        });
        return redirectToSettings("error", `QuickBooks authorization failed: ${errorParam}`);
    }
    if (!code || !state || !realmId) {
        return redirectToSettings("error", "QuickBooks did not return all required parameters.");
    }
    try {
        const result = await (0, quickbooks_1.completeQuickBooksOAuthCallback)(code, realmId, state);
        return redirectToSettings("success", `QuickBooks connected successfully. ${result.imported} invoices imported, ${result.updated} updated.`);
    }
    catch (error) {
        logger_1.logger.external({
            service: "QuickBooks",
            action: "oauth_callback",
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        return redirectToSettings("error", error instanceof Error ? error.message : "Failed to connect QuickBooks.");
    }
}
