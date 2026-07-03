"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalSyncButton = GlobalSyncButton;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const integrations_1 = require("@/app/actions/integrations");
const utils_1 = require("@/lib/utils");
const sonner_1 = require("sonner");
function GlobalSyncButton({ isExpanded, provider }) {
    const [isPending, startTransition] = (0, react_1.useTransition)();
    const handleSync = () => {
        startTransition(async () => {
            const res = await (0, integrations_1.syncIntegrationBackground)(provider);
            if (res.success) {
                sonner_1.toast.success(res.message);
            }
            else {
                sonner_1.toast.error(res.message);
            }
        });
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "relative flex w-full", children: (0, jsx_runtime_1.jsxs)("button", { onClick: handleSync, disabled: isPending, className: (0, utils_1.cn)("w-full flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100 disabled:opacity-50", !isExpanded && "justify-center"), title: `Sync ${provider === 'xero' ? 'Xero' : 'QuickBooks'}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: (0, utils_1.cn)("h-5 w-5 shrink-0", isPending && "animate-spin text-indigo-400") }), isExpanded && (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium", children: "Sync" })] }) }));
}
