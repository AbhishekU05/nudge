"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SEOPageTemplate;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const container_1 = require("@/components/site/container");
const scroll_animation_1 = require("@/components/site/scroll-animation");
const landing_page_body_1 = require("@/components/site/landing-page-body");
const site_header_1 = require("@/components/site/site-header");
const site_footer_1 = require("@/components/site/site-footer");
const auth_error_redirect_1 = require("@/components/site/auth-error-redirect");
function SEOPageTemplate({ data }) {
    const schemaMarkup = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "SoftwareApplication",
                "name": "Duely",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "WebBrowser",
                "offers": {
                    "@type": "Offer",
                    "price": "29.00",
                    "priceCurrency": "USD"
                },
                "description": data.metaDescription,
                "url": "https://duely.in"
            }
        ]
    };
    if (data.category && data.slug) {
        let categoryName = data.category.charAt(0).toUpperCase() + data.category.slice(1);
        let categoryPath = `/${data.category}`;
        if (data.category === 'competitor') {
            categoryName = 'Alternatives';
            categoryPath = '/alternatives';
        }
        if (data.category === 'industry') {
            categoryName = 'Industries';
            categoryPath = '/for';
        }
        if (data.category === 'integration') {
            categoryName = 'Integrations';
            categoryPath = '/integrations';
        }
        if (data.category === 'location') {
            categoryName = 'Locations';
            categoryPath = '/location';
        }
        if (data.category === 'use-case') {
            categoryName = 'Use Cases';
            categoryPath = '/use-case';
        }
        schemaMarkup["@graph"].push({
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://duely.in" },
                { "@type": "ListItem", "position": 2, "name": categoryName, "item": `https://duely.in${categoryPath}` },
                { "@type": "ListItem", "position": 3, "name": data.title, "item": `https://duely.in/${data.slug}` }
            ]
        });
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col min-h-screen", children: [(0, jsx_runtime_1.jsx)("script", { type: "application/ld+json", dangerouslySetInnerHTML: { __html: JSON.stringify(schemaMarkup) } }), (0, jsx_runtime_1.jsx)(auth_error_redirect_1.AuthErrorRedirect, {}), (0, jsx_runtime_1.jsx)(site_header_1.SiteHeader, {}), (0, jsx_runtime_1.jsxs)("main", { id: "main-content", className: "flex-1", children: [(0, jsx_runtime_1.jsx)("section", { className: "py-28 sm:py-36", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "max-w-3xl text-center", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl", children: data.h1 }), (0, jsx_runtime_1.jsx)("p", { className: "mt-6 text-lg leading-relaxed text-zinc-400 max-w-lg mx-auto", children: data.subtitle }), (0, jsx_runtime_1.jsx)("div", { className: "mt-10 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/signup", className: "inline-flex items-center rounded-lg bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500", children: data.cta }) })] }) }), data.painPoint && data.category !== 'industry' && ((0, jsx_runtime_1.jsx)("section", { className: "py-20 bg-zinc-950/50 border-y border-white/5 backdrop-blur-sm", children: (0, jsx_runtime_1.jsx)(container_1.Container, { children: (0, jsx_runtime_1.jsx)(scroll_animation_1.FadeIn, { className: "max-w-3xl mx-auto", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-zinc-900 border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50" }), (0, jsx_runtime_1.jsx)("h2", { className: "text-2xl md:text-3xl font-semibold tracking-tight text-zinc-100 mb-6", children: "The Real Problem" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg text-zinc-400 leading-relaxed", children: data.painPoint })] }) }) }) })), data.features && data.features.length > 0 && data.category !== 'industry' && ((0, jsx_runtime_1.jsx)("section", { className: "py-24", children: (0, jsx_runtime_1.jsx)(container_1.Container, { children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-5xl mx-auto", children: [(0, jsx_runtime_1.jsxs)(scroll_animation_1.FadeIn, { className: "text-center mb-16", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-3xl font-semibold tracking-[-0.03em] text-zinc-100 mb-4", children: "Why Duely is Built for You" }), (0, jsx_runtime_1.jsx)("p", { className: "text-zinc-400 max-w-2xl mx-auto text-lg", children: "We focus on one thing: getting your overdue invoices paid without ruining your client relationships." })] }), (0, jsx_runtime_1.jsx)(scroll_animation_1.FadeIn, { className: "grid md:grid-cols-3 gap-8 mb-24", children: data.features.map((feature, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.04] transition-colors", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-12 w-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20", children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-6 w-6 text-indigo-400" }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-zinc-300 font-medium leading-relaxed", children: feature })] }, index))) })] }) }) })), (0, jsx_runtime_1.jsx)(landing_page_body_1.LandingPageBody, {})] }), (0, jsx_runtime_1.jsx)(site_footer_1.SiteFooter, {})] }));
}
