"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.default = PortalPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const navigation_1 = require("next/navigation");
const admin_1 = require("@/lib/supabase/admin");
const types_1 = require("@/lib/types");
const xero_1 = require("@/lib/xero");
const quickbooks_1 = require("@/lib/quickbooks");
const client_portal_view_1 = require("@/components/portal/client-portal-view");
exports.dynamic = "force-dynamic";
async function PortalPage(props) {
    const params = await props.params;
    const token = params.token;
    if (!token)
        return (0, navigation_1.notFound)();
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    // Fetch client by unsubscribe_token
    const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id, name, user_id")
        .eq("unsubscribe_token", token)
        .single();
    if (clientError || !client) {
        console.error("Portal fetch error:", clientError, "token:", token);
        return (0, navigation_1.notFound)();
    }
    // Fetch invoices for this client
    const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("customer_id", client.id)
        .order("due_date", { ascending: true });
    if (invoicesError || !invoices) {
        console.error("Invoices fetch error:", invoicesError);
        return (0, navigation_1.notFound)();
    }
    // Fetch agency name (user profile)
    const { data: userProfile } = await supabase
        .from("profiles")
        .select("company_name, first_name, last_name")
        .eq("id", client.user_id)
        .single();
    const agencyName = userProfile?.company_name ||
        (userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name || ""}` : "Your Agency");
    // Dynamically fetch bank accounts from connected integrations
    const [xeroBanks, qbBanks] = await Promise.all([
        (0, xero_1.getXeroBankAccounts)(client.user_id),
        (0, quickbooks_1.getQuickBooksBankAccounts)(client.user_id)
    ]);
    const bankAccounts = [...(xeroBanks || []), ...(qbBanks || [])];
    const outstandingInvoices = invoices.filter((inv) => inv.workflow_status !== "paid" && inv.client_paid_at === null);
    const paidInvoices = invoices.filter((inv) => inv.workflow_status === "paid" || inv.client_paid_at !== null);
    const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + Math.max(0, Number(inv.amount_owed) - Number(inv.amount_paid)), 0);
    // Group unpaid invoices
    const overdueInvoices = [];
    const dueSoonInvoices = [];
    const otherOutstandingInvoices = [];
    outstandingInvoices.forEach(inv => {
        const overdueDays = inv.due_date ? (0, types_1.getDaysOverdue)(inv) : null;
        if (overdueDays !== null && overdueDays > 0) {
            overdueInvoices.push(inv);
        }
        else if (inv.due_date) {
            const [year, month, day] = inv.due_date.split("-").map(Number);
            const due = new Date(year, month - 1, day);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilDue <= 14) {
                dueSoonInvoices.push(inv);
            }
            else {
                otherOutstandingInvoices.push(inv);
            }
        }
        else {
            otherOutstandingInvoices.push(inv);
        }
    });
    // Assuming all invoices use the same currency, fallback to USD
    const currency = outstandingInvoices[0]?.currency || paidInvoices[0]?.currency || "USD";
    return ((0, jsx_runtime_1.jsx)(client_portal_view_1.ClientPortalView, { client: client, agencyName: agencyName, bankAccounts: bankAccounts, totalOutstanding: totalOutstanding, overdueInvoices: overdueInvoices, dueSoonInvoices: dueSoonInvoices, otherOutstandingInvoices: otherOutstandingInvoices, paidInvoices: paidInvoices, currency: currency, token: token }));
}
