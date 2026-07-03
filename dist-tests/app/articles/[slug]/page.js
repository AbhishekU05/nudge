"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStaticParams = generateStaticParams;
exports.generateMetadata = generateMetadata;
exports.default = ArticlePage;
const jsx_runtime_1 = require("react/jsx-runtime");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const gray_matter_1 = __importDefault(require("gray-matter"));
const link_1 = __importDefault(require("next/link"));
const script_1 = __importDefault(require("next/script"));
const react_markdown_1 = __importDefault(require("react-markdown"));
const remark_gfm_1 = __importDefault(require("remark-gfm"));
const container_1 = require("@/components/site/container");
const hero_email_capture_1 = require("@/components/site/hero-email-capture");
const site_header_1 = require("@/components/site/site-header");
const site_footer_1 = require("@/components/site/site-footer");
const badge_1 = require("@/components/ui/badge");
const article_content_1 = require("@/lib/seo/article-content");
const site_1 = require("@/lib/seo/site");
async function generateStaticParams() {
    const articlesDir = path_1.default.join(process.cwd(), "public", "articles");
    const files = fs_1.default.readdirSync(articlesDir).filter((f) => f.endsWith(".md"));
    return files.map((file) => ({
        slug: file.replace(".md", ""),
    }));
}
async function generateMetadata({ params, }) {
    const { slug } = await params;
    const filePath = path_1.default.join(process.cwd(), "public", "articles", `${slug}.md`);
    if (!fs_1.default.existsSync(filePath)) {
        return {
            title: "Article Not Found | Duely",
        };
    }
    const fileContent = fs_1.default.readFileSync(filePath, "utf8");
    const { data } = (0, gray_matter_1.default)(fileContent);
    const title = data.title || "Article";
    return {
        title,
        description: data.description || "",
        alternates: {
            canonical: `/articles/${slug}`,
        },
        openGraph: {
            title,
            description: data.description || "",
            type: "article",
            url: `${site_1.SITE_URL}/articles/${slug}`,
        },
    };
}
function buildArticleSchemas({ title, description, slug, quickAnswer, faqItems, }) {
    const pageUrl = `${site_1.SITE_URL}/articles/${slug}`;
    const duelyOrganization = {
        "@type": "Organization",
        name: "Duely",
        url: site_1.SITE_URL,
    };
    const schemas = [
        {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            description,
            author: duelyOrganization,
            publisher: {
                ...duelyOrganization,
                logo: {
                    "@type": "ImageObject",
                    url: `${site_1.SITE_URL}/logo.svg`,
                },
            },
            datePublished: "2025-01-01",
            dateModified: "2026-06-18",
            mainEntityOfPage: {
                "@type": "WebPage",
                "@id": pageUrl,
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
                    name: "Articles",
                    item: `${site_1.SITE_URL}/articles`,
                },
                {
                    "@type": "ListItem",
                    position: 3,
                    name: title,
                    item: pageUrl,
                },
            ],
        },
    ];
    if (quickAnswer) {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "WebPage",
            url: pageUrl,
            speakable: {
                "@type": "SpeakableSpecification",
                cssSelector: ["#quick-answer"],
            },
        });
    }
    if (faqItems.length > 0) {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: item.answer,
                },
            })),
        });
    }
    return schemas;
}
async function ArticlePage({ params, }) {
    const { slug } = await params;
    const filePath = path_1.default.join(process.cwd(), "public", "articles", `${slug}.md`);
    if (!fs_1.default.existsSync(filePath)) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-1 items-center justify-center p-20", children: (0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-semibold", children: "Article not found" }) }));
    }
    const fileContent = fs_1.default.readFileSync(filePath, "utf8");
    const { data, content } = (0, gray_matter_1.default)(fileContent);
    const title = data.title || "Article";
    const description = data.description || "";
    const audience = data.audience || "Guides";
    const quickAnswer = (0, article_content_1.extractQuickAnswer)(content);
    const faqItems = (0, article_content_1.extractFaqItems)(content);
    const { body } = (0, article_content_1.splitArticleContent)(content);
    const jsonLd = buildArticleSchemas({
        title,
        description,
        slug,
        quickAnswer,
        faqItems,
    });
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 flex-col", children: [jsonLd.map((schema, index) => ((0, jsx_runtime_1.jsx)(script_1.default, { id: `schema-${index}`, type: "application/ld+json", dangerouslySetInnerHTML: {
                    __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
                } }, index))), (0, jsx_runtime_1.jsx)(site_header_1.SiteHeader, {}), (0, jsx_runtime_1.jsxs)("main", { id: "main-content", className: "flex-1", children: [(0, jsx_runtime_1.jsx)("section", { className: "border-b border-white/5 bg-gradient-to-b from-indigo-950/20 to-transparent", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "py-20 sm:py-28 text-center", children: [(0, jsx_runtime_1.jsxs)("nav", { className: "mb-8 text-sm text-zinc-500 font-medium mx-auto max-w-4xl flex items-center justify-center space-x-2", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/", className: "hover:text-zinc-300 transition-colors", children: "Home" }), (0, jsx_runtime_1.jsx)("span", { children: ">" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/articles", className: "hover:text-zinc-300 transition-colors", children: "Articles" }), (0, jsx_runtime_1.jsx)("span", { children: ">" }), (0, jsx_runtime_1.jsx)("span", { className: "text-zinc-300", children: title })] }), (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "default", className: "mb-6 bg-white/[0.03] text-zinc-400 border-white/10", children: audience }), (0, jsx_runtime_1.jsx)("h1", { className: "mx-auto max-w-4xl text-pretty text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl", children: title }), description && ((0, jsx_runtime_1.jsx)("p", { className: "mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-400", children: description }))] }) }), quickAnswer && ((0, jsx_runtime_1.jsx)("section", { className: "border-b border-white/5 bg-indigo-950/10", children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "py-10 sm:py-12", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-3xl", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-sm font-semibold uppercase tracking-widest text-indigo-300", children: "Quick Answer" }), (0, jsx_runtime_1.jsx)("p", { id: "quick-answer", className: "mt-4 text-base leading-8 text-zinc-200", children: quickAnswer })] }) }) })), (0, jsx_runtime_1.jsx)("section", { className: "border-b border-white/5 bg-white/[0.01]", children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "py-20 sm:py-28", children: (0, jsx_runtime_1.jsx)("div", { className: "mx-auto max-w-3xl prose prose-invert prose-indigo prose-img:rounded-xl prose-a:text-indigo-400 hover:prose-a:text-indigo-300", children: (0, jsx_runtime_1.jsx)(react_markdown_1.default, { remarkPlugins: [remark_gfm_1.default], components: {
                                        table: ({ node, ...props }) => ((0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto w-full mb-8", children: (0, jsx_runtime_1.jsx)("table", { className: "w-full text-left border-collapse", ...props }) }))
                                    }, children: body }) }) }) }), (0, jsx_runtime_1.jsx)("section", { children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "py-20 sm:py-28", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-2xl rounded-3xl border border-white/10 bg-gradient-to-b from-indigo-950/30 to-transparent px-8 py-16 text-center sm:px-14 sm:py-20", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl", children: "Ready to organize your receivables?" }), (0, jsx_runtime_1.jsx)("p", { className: "mx-auto mt-5 max-w-lg text-base leading-7 text-zinc-400", children: "Stop chasing clients out of your inbox. Bring operational clarity to your post-invoice workflow and start collecting payments professionally." }), (0, jsx_runtime_1.jsx)("div", { className: "mt-10 flex justify-center", children: (0, jsx_runtime_1.jsx)(hero_email_capture_1.HeroEmailCapture, { className: "w-full max-w-md" }) })] }) }) })] }), (0, jsx_runtime_1.jsx)(site_footer_1.SiteFooter, {})] }));
}
