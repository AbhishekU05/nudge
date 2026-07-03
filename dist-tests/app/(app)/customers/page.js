"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CustomersPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const container_1 = require("@/components/site/container");
const button_1 = require("@/components/ui/button");
const auth_1 = require("@/lib/auth");
const server_1 = require("@/lib/supabase/server");
const types_1 = require("@/lib/types");
const groups_manager_1 = require("./components/groups-manager");
const customer_groups_assigner_1 = require("./components/customer-groups-assigner");
async function CustomersPage({ searchParams, }) {
    const params = await searchParams;
    const groupId = params?.groupId;
    const user = await (0, auth_1.requireUser)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    // Fetch clients
    const { data: clients } = await supabase
        .from("clients")
        .select("*")
        .order("name", { ascending: true })
        .returns();
    // Fetch invoices to calculate aggregates
    const { data: invoices } = await supabase
        .from("invoices")
        .select("*")
        .returns();
    // Fetch groups
    const { data: groupsData } = await supabase
        .from("groups")
        .select("*")
        .order("name", { ascending: true })
        .returns();
    // Fetch customer groups
    const { data: customerGroupsData } = await supabase
        .from("customer_groups")
        .select("*");
    const invoicesList = invoices || [];
    const groupsList = groupsData || [];
    const customerGroupsList = customerGroupsData || [];
    let clientsList = clients || [];
    if (groupId) {
        const groupCustomerIds = customerGroupsList
            .filter((cg) => cg.group_id === groupId)
            .map((cg) => cg.customer_id);
        clientsList = clientsList.filter((c) => groupCustomerIds.includes(c.id));
    }
    const clientsWithData = clientsList.map((client) => {
        const clientInvoices = invoicesList.filter(i => i.customer_id === client.id || (i.recipient_name === client.name));
        const totalOwed = clientInvoices.reduce((sum, inv) => {
            if (inv.workflow_status === "paid" || inv.workflow_status === "written_off")
                return sum;
            return sum + (0, types_1.getRemainingBalance)(inv);
        }, 0);
        const currency = clientInvoices[0]?.currency || "USD";
        return {
            ...client,
            clientInvoices,
            totalOwed,
            currency
        };
    }).sort((a, b) => b.totalOwed - a.totalOwed);
    const activeGroup = groupId ? groupsList.find((g) => g.id === groupId) : null;
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex min-h-screen flex-col", children: (0, jsx_runtime_1.jsx)("main", { id: "main-content", className: "flex-1", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "py-8 sm:py-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [activeGroup && ((0, jsx_runtime_1.jsx)("div", { className: "mb-2", children: (0, jsx_runtime_1.jsxs)("span", { className: "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border border-zinc-800 bg-zinc-900/50 text-zinc-300", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-2 h-2 rounded-full shadow-sm", style: { backgroundColor: activeGroup.color || "#3b82f6" } }), activeGroup.name] }) })), (0, jsx_runtime_1.jsx)("h1", { className: "mt-4 text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl", children: "Customers" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 max-w-2xl text-base leading-7 text-zinc-500", children: "View all your customers and their aggregated balances across all invoices." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex shrink-0 flex-col sm:flex-row gap-3 sm:items-end", children: [(0, jsx_runtime_1.jsx)(groups_manager_1.GroupsManager, { groups: groupsList }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/customers/new", children: (0, jsx_runtime_1.jsxs)(button_1.Button, { className: "w-full sm:w-auto gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserRound, { className: "h-4 w-4" }), "Add customer"] }) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-left text-sm text-zinc-400", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-white/[0.02] border-b border-white/10", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 font-medium text-zinc-300", children: "Name" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 font-medium text-zinc-300", children: "Email" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 font-medium text-zinc-300 text-right", children: "Total Owed" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 font-medium text-zinc-300 text-right", children: "Total Invoices" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-white/10", children: clientsWithData.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 5, className: "p-8 text-center text-zinc-500", children: "No customers found. Sync from Xero/Quickbooks or add one manually." }) })) : (clientsWithData.map(({ id, name, email, clientInvoices, totalOwed, currency }) => {
                                        const formattedTotal = new Intl.NumberFormat(undefined, {
                                            style: "currency",
                                            currency
                                        }).format(totalOwed);
                                        const assignedGroupIds = customerGroupsList
                                            .filter((cg) => cg.customer_id === id)
                                            .map((cg) => cg.group_id);
                                        return ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-white/[0.02] transition-colors", children: [(0, jsx_runtime_1.jsxs)("td", { className: "px-4 py-4 align-top", children: [(0, jsx_runtime_1.jsx)("div", { className: "font-medium text-zinc-200 mb-1.5", children: name }), (0, jsx_runtime_1.jsx)(customer_groups_assigner_1.CustomerGroupsAssigner, { customerId: id, allGroups: groupsList, assignedGroupIds: assignedGroupIds })] }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-4 align-top", children: email || "—" }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-4 text-right align-top font-medium text-zinc-200", children: formattedTotal }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-4 text-right align-top", children: clientInvoices.length }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-4 text-right align-top", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: `/customers/${id}`, children: (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "ghost", size: "sm", className: "h-8 gap-1 text-zinc-400 hover:text-zinc-100", children: ["View ", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-3.5 w-3.5" })] }) }) })] }, id));
                                    })) })] }) })] }) }) }));
}
