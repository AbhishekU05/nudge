"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsTabs = SettingsTabs;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const utils_1 = require("@/lib/utils");
function SettingsTabs() {
    const pathname = (0, navigation_1.usePathname)();
    const tabs = [
        { name: "General", href: "/settings/general" },
        { name: "Late Fees", href: "/settings/late-fees" },
        { name: "Integrations", href: "/settings/integrations" },
        { name: "Feedback", href: "/settings/feedback" },
        { name: "Billing", href: "/settings/billing" },
    ];
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex gap-4 border-b border-white/10 mb-8 overflow-x-auto", children: tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname?.startsWith(tab.href + "/");
            return ((0, jsx_runtime_1.jsx)(link_1.default, { href: tab.href, className: (0, utils_1.cn)("whitespace-nowrap px-1 pb-4 text-sm font-medium transition-colors border-b-2", isActive
                    ? "border-primary text-zinc-50"
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-white/20"), children: tab.name }, tab.name));
        }) }));
}
