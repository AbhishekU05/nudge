"use strict";
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
exports.syncXero = void 0;
const client_1 = require("@/lib/inngest/client");
const xero_1 = require("@/lib/xero");
const admin_1 = require("@/lib/supabase/admin");
const logger_1 = require("@/lib/logger");
exports.syncXero = client_1.inngest.createFunction({ id: "sync-xero", triggers: [{ cron: "0 * * * *" }] }, async ({ step }) => {
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    const { data: integrations, error } = await supabase
        .from("integrations")
        .select("organization_id, organizations!inner(dodo_subscription_status, created_at)")
        .eq("provider", "xero");
    if (error) {
        logger_1.logger.external({
            service: "Xero",
            action: "cron_sync",
            success: false,
            error: error.message,
        });
        throw new Error(error.message);
    }
    const { isAutomationAndIntegrationAllowed } = await Promise.resolve().then(() => __importStar(require("@/lib/payments")));
    const results = [];
    for (const integration of integrations || []) {
        const org = Array.isArray(integration.organizations) ? integration.organizations[0] : integration.organizations;
        if (!isAutomationAndIntegrationAllowed(org?.dodo_subscription_status, org?.created_at)) {
            continue;
        }
        try {
            const result = await (0, xero_1.syncXeroInvoicesForOrg)(integration.organization_id);
            results.push({ organizationId: integration.organization_id, success: true, ...result });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            results.push({ organizationId: integration.organization_id, success: false, error: message });
            logger_1.logger.external({
                service: "Xero",
                action: "cron_sync",
                success: false,
                organization_id: integration.organization_id,
                error: message,
            });
        }
    }
    return { results };
});
