"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteHeader = SiteHeader;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const image_1 = __importDefault(require("next/image"));
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const container_1 = require("@/components/site/container");
const button_1 = require("@/components/ui/button");
const navItems = [
    { name: "Features", href: "/features" },
    { name: "About", href: "/about" },
];
function SiteHeader() {
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const pathname = (0, navigation_1.usePathname)();
    // Close menu when route changes
    (0, react_1.useEffect)(() => {
        // eslint-disable-next-line
        setIsOpen(false);
    }, [pathname]);
    // Prevent scrolling when mobile menu is open
    (0, react_1.useEffect)(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        }
        else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);
    return ((0, jsx_runtime_1.jsxs)("header", { className: "sticky top-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl", children: [(0, jsx_runtime_1.jsxs)(container_1.Container, { className: "flex h-16 items-center justify-between", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/", className: "flex items-center gap-2 transition-opacity hover:opacity-90 z-50", children: [(0, jsx_runtime_1.jsx)(image_1.default, { src: "/logo.svg", width: 32, height: 32, alt: "Duely Logo", priority: true, className: "h-8 w-8 rounded-md shadow-sm" }), (0, jsx_runtime_1.jsx)("span", { className: "text-xl font-semibold tracking-tight text-zinc-50", children: "Duely" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "hidden sm:flex items-center gap-3", children: [navItems.map((item) => ((0, jsx_runtime_1.jsx)(link_1.default, { href: item.href, className: `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pathname === item.href || pathname?.startsWith(item.href + "/")
                                    ? "bg-white/[0.04] text-zinc-100"
                                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"}`, children: item.name }, item.href))), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/how-it-works", children: (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", size: "sm", className: "text-zinc-300 hover:text-zinc-50", children: "How it works" }) }), (0, jsx_runtime_1.jsx)("a", { href: "/#pricing", className: "rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100", children: "Pricing" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/login", children: (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", size: "sm", className: "text-zinc-300 hover:text-zinc-50", children: "Sign in" }) }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/signup", children: (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", className: "shadow-lg shadow-indigo-500/20", children: "Get started" }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex sm:hidden items-center gap-3 z-50", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/signup", children: (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", className: "h-8 text-xs px-3 shadow-lg shadow-indigo-500/20", children: "Get started" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsOpen(!isOpen), className: "p-2 -mr-2 text-zinc-400 hover:text-zinc-100 focus:outline-none flex items-center justify-center min-h-[44px] min-w-[44px]", "aria-label": "Toggle menu", children: isOpen ? (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-6 w-6" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Menu, { className: "h-6 w-6" }) })] })] }), isOpen && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 top-16 z-40 bg-zinc-950 px-6 py-6 sm:hidden overflow-y-auto", children: (0, jsx_runtime_1.jsxs)("nav", { className: "flex flex-col gap-4", children: [navItems.map((item) => ((0, jsx_runtime_1.jsx)(link_1.default, { href: item.href, className: `text-lg font-medium p-3 -mx-2 min-h-[44px] flex items-center rounded-lg transition-colors ${pathname === item.href || pathname?.startsWith(item.href + "/")
                                ? "text-zinc-100 bg-white/[0.04]"
                                : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.02]"}`, children: item.name }, item.href))), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4 pt-4 border-t border-white/10 flex flex-col gap-3", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/how-it-works", children: (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", className: "w-full justify-center h-12 text-base bg-transparent text-zinc-300 border border-zinc-800 hover:bg-white/[0.04]", children: "How it works" }) }), (0, jsx_runtime_1.jsx)("a", { href: "/#pricing", onClick: () => setIsOpen(false), children: (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", className: "w-full justify-center h-12 text-base bg-transparent text-zinc-300 border border-zinc-800 hover:bg-white/[0.04]", children: "Pricing" }) }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/login", children: (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "secondary", className: "w-full justify-center h-12 text-base", children: "Sign in" }) })] })] }) }))] }));
}
