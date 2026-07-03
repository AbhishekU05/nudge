"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PipelinePage;
const jsx_runtime_1 = require("react/jsx-runtime");
const container_1 = require("@/components/site/container");
const auth_1 = require("@/lib/auth");
const server_1 = require("@/lib/supabase/server");
const pipeline_client_1 = require("./pipeline-client");
const currency_selector_1 = require("@/components/site/currency-selector");
async function PipelinePage(props) {
    const searchParams = await props.searchParams;
    const user = await (0, auth_1.requireUser)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) {
        console.error("Error fetching customers for pipeline:", error);
    }
    const allCustomers = (data || []);
    // Handle currencies
    const uniqueCurrencies = Array.from(new Set(allCustomers.map(c => c.currency || 'USD'))).sort();
    const selectedCurrency = searchParams?.currency || (uniqueCurrencies.includes('USD') ? 'USD' : uniqueCurrencies[0] || 'USD');
    const customers = allCustomers.filter(c => (c.currency || 'USD') === selectedCurrency);
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex min-h-screen flex-col", children: (0, jsx_runtime_1.jsx)("main", { id: "main-content", className: "flex-1", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "py-8 sm:py-10 max-w-[1600px]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8 flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl", children: "Collections Pipeline" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 max-w-2xl text-base leading-7 text-zinc-500", children: "View your clients across stages to track your recovery process." })] }), (0, jsx_runtime_1.jsx)(currency_selector_1.CurrencySelector, { currencies: uniqueCurrencies, selected: selectedCurrency })] }), (0, jsx_runtime_1.jsx)(pipeline_client_1.PipelineClient, { initialCustomers: customers, currency: selectedCurrency })] }) }) }));
}
