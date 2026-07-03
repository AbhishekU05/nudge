"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSidebar = AppSidebar;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const image_1 = __importDefault(require("next/image"));
const auth_1 = require("@/app/actions/auth");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const global_sync_button_1 = require("./global-sync-button");
const sidebar_groups_1 = require("./sidebar-groups");
function AppSidebar({ user, subscriptionStatus, hasXero, hasQuickBooks, groups = [], totalCustomers = 0 }) {
    const [isExpanded, setIsExpanded] = (0, react_1.useState)(false);
    const pathname = (0, navigation_1.usePathname)();
    const navItems = [
        { name: "Overview", href: "/dashboard", icon: lucide_react_1.LayoutDashboard, color: "text-indigo-400", hoverColor: "hover:text-indigo-400", activeBg: "bg-indigo-500/10" },
        { name: "Action Center", href: "/actions", icon: lucide_react_1.Zap, color: "text-amber-400", hoverColor: "hover:text-amber-400", activeBg: "bg-amber-500/10" },
        { name: "Activity", href: "/activity", icon: lucide_react_1.Activity, color: "text-emerald-400", hoverColor: "hover:text-emerald-400", activeBg: "bg-emerald-500/10" },
        { name: "Pipeline", href: "/pipeline", icon: lucide_react_1.KanbanSquare, color: "text-amber-400", hoverColor: "hover:text-amber-400", activeBg: "bg-amber-500/10" },
        { name: "Analytics", href: "/analytics", icon: lucide_react_1.BarChart3, color: "text-blue-400", hoverColor: "hover:text-blue-400", activeBg: "bg-blue-500/10" },
        { name: "Automate", href: "/automate", icon: lucide_react_1.Mail, color: "text-amber-400", hoverColor: "hover:text-amber-400", activeBg: "bg-amber-500/10" },
    ];
    const bottomItems = [
        {
            name: subscriptionStatus === "active" ? "Plan: Active" : "Billing & Plan",
            href: "/settings/billing",
            icon: lucide_react_1.CreditCard
        },
        { name: "Settings", href: "/settings/general", icon: lucide_react_1.Settings },
    ];
    const [isProfileOpen, setIsProfileOpen] = (0, react_1.useState)(false);
    const profileRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, utils_1.cn)("flex flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-300 z-50 h-screen sticky top-0", isExpanded ? "w-64" : "w-16"), onMouseEnter: () => setIsExpanded(true), onMouseLeave: () => setIsExpanded(false), children: [(0, jsx_runtime_1.jsx)("div", { className: "flex h-16 shrink-0 items-center justify-center border-b border-white/10", children: (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/dashboard", className: "flex items-center gap-3 overflow-hidden px-2 w-full justify-center", children: [(0, jsx_runtime_1.jsx)(image_1.default, { src: "/logo.svg", width: 32, height: 32, alt: "Duely Logo", className: "h-8 w-8 shrink-0 rounded-md" }), isExpanded && ((0, jsx_runtime_1.jsx)("span", { className: "text-xl font-semibold tracking-tight text-zinc-50 truncate transition-opacity duration-300", children: "Duely" }))] }) }), (0, jsx_runtime_1.jsxs)("nav", { className: "flex-1 space-y-1 p-2 overflow-y-auto", children: [navItems.map((item) => {
                        const isActive = pathname?.startsWith(item.href);
                        return ((0, jsx_runtime_1.jsxs)(link_1.default, { href: item.href, prefetch: true, className: (0, utils_1.cn)("flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors", isActive
                                ? `${item.activeBg} ${item.color} font-medium`
                                : `text-zinc-400 hover:bg-white/[0.04] ${item.hoverColor}`), children: [(0, jsx_runtime_1.jsx)(item.icon, { className: "h-5 w-5 shrink-0" }), isExpanded && ((0, jsx_runtime_1.jsx)("span", { className: "truncate whitespace-nowrap text-sm", children: item.name }))] }, item.name));
                    }), groups && (0, jsx_runtime_1.jsx)(sidebar_groups_1.SidebarGroups, { groups: groups, totalCustomers: totalCustomers, isExpanded: isExpanded })] }), (0, jsx_runtime_1.jsxs)("div", { className: "border-t border-white/10 p-2 space-y-1", children: [(hasXero || hasQuickBooks) && ((0, jsx_runtime_1.jsx)("div", { className: "mb-1", children: (0, jsx_runtime_1.jsx)(global_sync_button_1.GlobalSyncButton, { isExpanded: isExpanded, provider: hasXero ? 'xero' : 'quickbooks' }) })), bottomItems.map((item) => {
                        const isActive = pathname?.startsWith(item.href);
                        return ((0, jsx_runtime_1.jsxs)(link_1.default, { href: item.href, prefetch: true, className: (0, utils_1.cn)("flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors", isActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"), children: [(0, jsx_runtime_1.jsx)(item.icon, { className: "h-5 w-5 shrink-0" }), isExpanded && ((0, jsx_runtime_1.jsx)("span", { className: "truncate whitespace-nowrap text-sm", children: item.name }))] }, item.name));
                    })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-2 border-t border-white/10 relative", ref: profileRef, children: [(0, jsx_runtime_1.jsxs)("div", { onClick: () => setIsProfileOpen(!isProfileOpen), className: "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.04] cursor-pointer", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-xs font-semibold text-zinc-100", children: user.initials }), isExpanded && ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-col min-w-0 flex-1", children: (0, jsx_runtime_1.jsx)("span", { className: "truncate text-sm font-medium text-zinc-200", children: user.displayName }) }))] }), isProfileOpen && ((0, jsx_runtime_1.jsxs)("div", { className: (0, utils_1.cn)("absolute bottom-full mb-2 bg-zinc-900 border border-white/10 shadow-xl rounded-lg py-1 flex flex-col z-50", isExpanded ? "left-2 right-2" : "left-2 w-48"), children: [(0, jsx_runtime_1.jsxs)("div", { className: "px-3 py-2 border-b border-white/10 mb-1", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-zinc-200 truncate", children: user.displayName }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-500 truncate", children: user.email })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/settings/general", className: "flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.04] hover:text-zinc-100 transition-colors", onClick: () => setIsProfileOpen(false), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserRound, { className: "h-4 w-4" }), "Profile Settings"] }), (0, jsx_runtime_1.jsx)("form", { action: auth_1.logout, children: (0, jsx_runtime_1.jsxs)("button", { type: "submit", className: "w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.LogOut, { className: "h-4 w-4" }), "Sign out"] }) })] }))] })] }));
}
