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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CustomerPage;
const jsx_runtime_1 = require("react/jsx-runtime");
/* eslint-disable */
const navigation_1 = require("next/navigation");
const auth_1 = require("@/lib/auth");
const server_1 = require("@/lib/supabase/server");
const customer_details_1 = require("@/components/site/customer-details");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const container_1 = require("@/components/site/container");
async function CustomerPage(props) {
    const { id } = await props.params;
    const { tab } = await props.searchParams;
    const user = await (0, auth_1.requireUser)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: customerData, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (error || !customerData) {
        (0, navigation_1.notFound)();
    }
    // Fetch group if customer_id exists
    let group = undefined;
    if (customerData.customer_id) {
        const { data: groupData } = await supabase
            .from("customer_groups")
            .select("groups(*)")
            .eq("customer_id", customerData.customer_id)
            .maybeSingle();
        if (groupData?.groups) {
            group = groupData.groups;
        }
    }
    // Fetch events for this customer
    const { data: eventsData } = await supabase
        .from("customer_events")
        .select("*")
        .eq("invoice_id", id)
        .order("created_at", { ascending: false });
    const payment_history = [];
    const followup_history = [];
    for (const event of eventsData ?? []) {
        if (event.event_type === "payment") {
            payment_history.push({
                id: event.id,
                invoice_id: event.invoice_id,
                customer_id: event.customer_id,
                user_id: event.user_id,
                amount: Number(event.amount),
                currency: event.currency ?? "USD",
                source: event.payment_source || "user",
                created_at: event.created_at,
            });
        }
        else if (event.event_type === "followup") {
            followup_history.push({
                id: event.id,
                invoice_id: event.invoice_id,
                customer_id: event.customer_id,
                user_id: event.user_id,
                method: event.followup_method,
                outcome: event.followup_outcome,
                note: event.note,
                followup_date: event.event_date,
                created_at: event.created_at,
            });
        }
    }
    const customerRecord = {
        ...customerData,
        amount_owed: Number(customerData.amount_owed),
        amount_paid: Number(customerData.amount_paid),
        payment_history,
        followup_history,
    };
    const { isAutomationAndIntegrationAllowed } = await Promise.resolve().then(() => __importStar(require("@/lib/payments")));
    const { data: org } = await supabase
        .from("organizations")
        .select("dodo_subscription_status, created_at")
        .eq("id", customerData.organization_id)
        .single();
    const isAllowed = org ? isAutomationAndIntegrationAllowed(org.dodo_subscription_status, org.created_at) : false;
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex-1 overflow-y-auto", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "py-6", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/dashboard", className: "inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 mb-2 transition-colors", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { className: "h-4 w-4" }), "Back to Dashboard"] }), (0, jsx_runtime_1.jsx)(customer_details_1.CustomerDetails, { customer: customerRecord, group: group, isAllowed: isAllowed, initialTab: tab || "payment", isDevelopment: process.env.NODE_ENV === "development" })] }) }));
}
