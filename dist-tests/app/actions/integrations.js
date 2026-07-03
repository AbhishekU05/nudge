"use strict";
"use server";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncIntegrationBackground = void 0;
exports.syncXeroNow = syncXeroNow;
exports.disconnectXero = disconnectXero;
exports.syncQuickBooksNow = syncQuickBooksNow;
exports.disconnectQuickBooks = disconnectQuickBooks;
exports.disconnectGmail = disconnectGmail;
exports.syncIntegrationNow = syncIntegrationNow;
exports.dailyBackgroundSync = dailyBackgroundSync;
const cache_1 = require("next/cache");
const navigation_1 = require("next/navigation");
const auth_1 = require("@/lib/auth");
const paths_1 = require("@/lib/paths");
const server_1 = require("@/lib/supabase/server");
const xero_1 = require("@/lib/xero");
const quickbooks_1 = require("@/lib/quickbooks");
function redirectToIntegrations(params) {
    (0, navigation_1.redirect)((0, paths_1.buildPathWithQuery)("/settings/integrations", params));
}
async function getOrganizationId(userId) {
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .maybeSingle();
    return data?.organization_id ?? null;
}
async function syncXeroNow() {
    const user = await (0, auth_1.requireUser)();
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        redirectToIntegrations({ error: "No organization found." });
    let result;
    try {
        result = await (0, xero_1.syncXeroInvoicesForOrg)(organizationId);
    }
    catch (error) {
        redirectToIntegrations({
            error: error instanceof Error ? error.message : "Unable to sync Xero.",
        });
    }
    (0, cache_1.revalidatePath)("/dashboard");
    (0, cache_1.revalidatePath)("/settings/integrations");
    redirectToIntegrations({
        success: `Xero sync complete. Imported ${result.imported}, updated ${result.updated}, marked paid ${result.markedPaid}.`,
    });
}
async function disconnectXero() {
    const user = await (0, auth_1.requireUser)();
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        redirectToIntegrations({ error: "No organization found." });
    await (0, xero_1.revokeXeroIntegration)(organizationId);
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { error } = await supabase
        .from("integrations")
        .delete()
        .eq("organization_id", organizationId)
        .eq("provider", "xero");
    if (error) {
        redirectToIntegrations({ error: "Unable to disconnect Xero." });
    }
    (0, cache_1.revalidatePath)("/dashboard");
    (0, cache_1.revalidatePath)("/settings/integrations");
    redirectToIntegrations({ success: "Xero disconnected." });
}
async function syncQuickBooksNow() {
    const user = await (0, auth_1.requireUser)();
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        redirectToIntegrations({ error: "No organization found." });
    let result;
    try {
        result = await (0, quickbooks_1.syncQuickBooksInvoicesForOrg)(organizationId);
    }
    catch (error) {
        redirectToIntegrations({
            error: error instanceof Error ? error.message : "Unable to sync QuickBooks.",
        });
    }
    (0, cache_1.revalidatePath)("/dashboard");
    (0, cache_1.revalidatePath)("/settings/integrations");
    redirectToIntegrations({
        success: `QuickBooks sync complete. Imported ${result.imported}, updated ${result.updated}, marked paid ${result.markedPaid}.`,
    });
}
async function disconnectQuickBooks() {
    const user = await (0, auth_1.requireUser)();
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        redirectToIntegrations({ error: "No organization found." });
    await (0, quickbooks_1.revokeQuickBooksIntegration)(organizationId);
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { error } = await supabase
        .from("integrations")
        .delete()
        .eq("organization_id", organizationId)
        .eq("provider", "quickbooks");
    if (error) {
        redirectToIntegrations({ error: "Unable to disconnect QuickBooks." });
    }
    (0, cache_1.revalidatePath)("/dashboard");
    (0, cache_1.revalidatePath)("/settings/integrations");
    redirectToIntegrations({ success: "QuickBooks disconnected." });
}
async function disconnectGmail() {
    const user = await (0, auth_1.requireUser)();
    const adminSupabase = (await Promise.resolve().then(() => __importStar(require("@/lib/supabase/admin")))).createSupabaseAdminClient();
    const { error } = await adminSupabase
        .from("profiles")
        .update({
        google_access_token: null,
        google_refresh_token: null,
        gmail_connected_email: null,
    })
        .eq("user_id", user.id);
    if (error) {
        redirectToIntegrations({ error: "Unable to disconnect Gmail." });
    }
    (0, cache_1.revalidatePath)("/dashboard");
    (0, cache_1.revalidatePath)("/settings/integrations");
    redirectToIntegrations({ success: "Gmail disconnected. Reminders will now send from reminders@duely.in." });
}
/**
 * On-demand sync triggered from the UI "Sync Now" button.
 * Replaces the old dailyBackgroundSync cron pattern.
 */
async function syncIntegrationNow(provider) {
    const user = await (0, auth_1.requireUser)();
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        return { success: false, message: "No organization found." };
    try {
        let result;
        if (provider === "xero") {
            result = await (0, xero_1.syncXeroInvoicesForOrg)(organizationId);
        }
        else {
            result = await (0, quickbooks_1.syncQuickBooksInvoicesForOrg)(organizationId);
        }
        (0, cache_1.revalidatePath)("/dashboard");
        (0, cache_1.revalidatePath)("/customers");
        return { success: true, message: `Synced ${result.imported} imported, ${result.updated} updated.` };
    }
    catch (error) {
        return { success: false, message: `Server Error: Unable to sync ${provider}.` };
    }
}
/**
 * @deprecated Use syncIntegrationNow instead.
 * Kept for backward compatibility with components that haven't been migrated.
 */
exports.syncIntegrationBackground = syncIntegrationNow;
/**
 * @deprecated Replaced by event-driven Xero/QuickBooks webhooks (Milestone 6).
 * Kept as a no-op stub so the DashboardBackgroundSync component compiles.
 * Remove once that component is updated to use webhooks.
 */
async function dailyBackgroundSync() {
    // Cron-based daily sync was removed in Milestone 2 (Zero-Cron Architecture).
    // Syncing now happens via push webhooks from Xero/QuickBooks.
    // This stub exists solely to prevent the dashboard-background-sync component
    // from breaking until it is updated to remove this call.
    return { success: true };
}
