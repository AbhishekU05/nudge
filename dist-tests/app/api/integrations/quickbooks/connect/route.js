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
exports.dynamic = exports.runtime = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const quickbooks_1 = require("@/lib/quickbooks");
const server_2 = require("@/lib/supabase/server");
const reminder_1 = require("@/lib/email/reminder");
exports.runtime = "nodejs";
exports.dynamic = "force-dynamic";
function redirectToSettings(key, message) {
    const url = new URL("/settings/integrations", (0, reminder_1.getAppUrl)());
    url.searchParams.set(key, message);
    return server_1.NextResponse.redirect(url);
}
async function GET() {
    const supabase = await (0, server_2.createSupabaseServerClient)();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        const url = new URL("/login", (0, reminder_1.getAppUrl)());
        url.searchParams.set("next", "/settings/integrations");
        return server_1.NextResponse.redirect(url);
    }
    // Paywall check
    const { data: member } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).single();
    if (member) {
        const { data: org } = await supabase.from("organizations").select("dodo_subscription_status, created_at").eq("id", member.organization_id).single();
        if (org) {
            const { isAutomationAndIntegrationAllowed } = await Promise.resolve().then(() => __importStar(require("@/lib/payments")));
            if (!isAutomationAndIntegrationAllowed(org.dodo_subscription_status, org.created_at)) {
                return redirectToSettings("error", "You must upgrade to a paid subscription to use integrations.");
            }
        }
    }
    try {
        const consentUrl = await (0, quickbooks_1.buildQuickBooksConsentUrl)(user.id);
        return server_1.NextResponse.redirect(consentUrl);
    }
    catch (error) {
        return redirectToSettings("error", error instanceof Error ? error.message : "Unable to start QuickBooks connection.");
    }
}
