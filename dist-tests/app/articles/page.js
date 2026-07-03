"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = ArticlesPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const gray_matter_1 = __importDefault(require("gray-matter"));
const link_1 = __importDefault(require("next/link"));
const container_1 = require("@/components/site/container");
const site_header_1 = require("@/components/site/site-header");
const site_footer_1 = require("@/components/site/site-footer");
exports.metadata = {
    title: "Articles & Guides",
    description: "Learn how to manage accounts receivable, collect payments professionally, and follow up on overdue invoices without burning relationships.",
    alternates: { canonical: "/articles" },
};
function ArticlesPage() {
    const articlesDir = path_1.default.join(process.cwd(), "public", "articles");
    const files = fs_1.default.readdirSync(articlesDir).filter((f) => f.endsWith(".md"));
    const articles = files.map((file) => {
        const filePath = path_1.default.join(articlesDir, file);
        const fileContent = fs_1.default.readFileSync(filePath, "utf8");
        const { data } = (0, gray_matter_1.default)(fileContent);
        return {
            slug: file.replace(".md", ""),
            title: data.title || "Untitled Article",
            description: data.description || "",
            audience: data.audience || "Guides",
        };
    });
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 flex-col overflow-x-hidden", children: [(0, jsx_runtime_1.jsx)(site_header_1.SiteHeader, {}), (0, jsx_runtime_1.jsxs)("main", { id: "main-content", className: "flex-1", children: [(0, jsx_runtime_1.jsx)("section", { className: "border-b border-white/5 bg-gradient-to-b from-indigo-950/20 to-transparent", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "py-20 sm:py-28 text-center", children: [(0, jsx_runtime_1.jsx)("h1", { className: "mx-auto max-w-4xl text-pretty text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl lg:text-6xl", children: "Articles & Guides" }), (0, jsx_runtime_1.jsx)("p", { className: "mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-400", children: "Expert advice on accounts receivable, professional follow-ups, and getting paid on time without burning client relationships." })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "py-16 sm:py-24", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-16", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-semibold tracking-[-0.03em] text-zinc-50 mb-8", children: "Start here: Most read articles" }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-4", children: articles
                                                .filter((a) => [
                                                "how-to-write-a-demand-letter-as-a-consultant",
                                                "how-to-track-payment-promises-from-clients",
                                                "what-to-say-when-a-client-misses-a-payment-deadline",
                                                "tools-for-tracking-outstanding-invoices"
                                            ].includes(a.slug))
                                                .map((article) => ((0, jsx_runtime_1.jsx)(link_1.default, { href: `/articles/${article.slug}`, children: (0, jsx_runtime_1.jsx)("div", { className: "group flex h-full flex-col justify-between rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] p-6 transition-colors hover:bg-indigo-500/[0.05]", children: (0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)("h3", { className: "mb-2 font-semibold text-zinc-100 transition-colors group-hover:text-indigo-300", children: article.title }) }) }) }, article.slug))) })] }), (0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-semibold tracking-[-0.03em] text-zinc-50 mb-8", children: "All articles" }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: articles.map((article) => ((0, jsx_runtime_1.jsx)(link_1.default, { href: `/articles/${article.slug}`, children: (0, jsx_runtime_1.jsx)("div", { className: "group flex h-full flex-col justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-7 transition-colors hover:border-indigo-500/30 hover:bg-white/[0.04]", children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "mb-3 font-semibold text-zinc-100 transition-colors group-hover:text-indigo-300", children: article.title }), (0, jsx_runtime_1.jsx)("p", { className: "line-clamp-3 text-sm leading-6 text-zinc-400", children: article.description })] }) }) }, article.slug))) })] }) })] }), (0, jsx_runtime_1.jsx)(site_footer_1.SiteFooter, {})] }));
}
