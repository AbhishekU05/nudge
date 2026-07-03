"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStaticParams = generateStaticParams;
exports.generateMetadata = generateMetadata;
exports.default = EntityPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const site_header_1 = require("@/components/site/site-header");
const site_footer_1 = require("@/components/site/site-footer");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const container_1 = require("@/components/site/container");
const entities_1 = require("@/lib/seo/entities");
const site_1 = require("@/lib/seo/site");
async function generateStaticParams() {
    return entities_1.entityDefinitions.map((entity) => ({ slug: entity.slug }));
}
async function generateMetadata({ params, }) {
    const { slug } = await params;
    const entity = (0, entities_1.getEntityBySlug)(slug);
    if (!entity) {
        return { title: "Not Found | Duely" };
    }
    return {
        title: entity.title,
        description: entity.metaDescription,
        alternates: {
            canonical: `/learn/${slug}`,
        },
        openGraph: {
            title: entity.title,
            description: entity.metaDescription,
            type: "article",
            url: `${site_1.SITE_URL}/learn/${slug}`,
        },
    };
}
async function EntityPage({ params, }) {
    const { slug } = await params;
    const entity = (0, entities_1.getEntityBySlug)(slug);
    if (!entity) {
        (0, navigation_1.notFound)();
    }
    const pageUrl = `${site_1.SITE_URL}/learn/${slug}`;
    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "DefinedTerm",
            name: entity.h1,
            description: entity.definition,
            url: pageUrl,
            inDefinedTermSet: {
                "@type": "DefinedTermSet",
                name: "Duely Collections Glossary",
                url: `${site_1.SITE_URL}/learn/duely`,
            },
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: site_1.SITE_URL,
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    name: entity.title,
                    item: pageUrl,
                },
            ],
        },
        {
            "@context": "https://schema.org",
            publisher: site_1.organizationSchema,
        },
    ];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 flex-col", children: [jsonLd.map((schema, index) => ((0, jsx_runtime_1.jsx)("script", { type: "application/ld+json", dangerouslySetInnerHTML: {
                    __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
                } }, index))), (0, jsx_runtime_1.jsx)(site_header_1.SiteHeader, {}), (0, jsx_runtime_1.jsxs)("main", { id: "main-content", className: "flex-1", children: [(0, jsx_runtime_1.jsx)("section", { className: "border-b border-white/5 bg-gradient-to-b from-indigo-950/20 to-transparent", children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "py-20 sm:py-28", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-3xl", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-pretty text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl", children: entity.h1 }), (0, jsx_runtime_1.jsx)("p", { id: "entity-definition", className: "mt-8 text-lg leading-8 text-zinc-300", children: entity.definition })] }) }) }), (0, jsx_runtime_1.jsx)("section", { className: "border-b border-white/5 bg-white/[0.01]", children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "py-16 sm:py-20", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-3xl", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold text-zinc-100", children: "Key points" }), (0, jsx_runtime_1.jsx)("ul", { className: "mt-6 space-y-3", children: entity.keyPoints.map((point) => ((0, jsx_runtime_1.jsxs)("li", { className: "flex gap-3 text-base leading-7 text-zinc-400", children: [(0, jsx_runtime_1.jsx)("span", { className: "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" }), point] }, point))) })] }) }) }), (0, jsx_runtime_1.jsx)("section", { children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "py-16 sm:py-20", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-3xl", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold text-zinc-100", children: "Related resources" }), (0, jsx_runtime_1.jsx)("ul", { className: "mt-6 space-y-3", children: entity.relatedLinks.map((link) => ((0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsx)(link_1.default, { href: link.href, className: "text-indigo-400 transition-colors hover:text-indigo-300", children: link.label }) }, link.href))) })] }) }) })] }), (0, jsx_runtime_1.jsx)(site_footer_1.SiteFooter, {})] }));
}
