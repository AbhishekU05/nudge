"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = ForFreelancersPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const script_1 = __importDefault(require("next/script"));
const navigation_1 = require("next/navigation");
const auth_error_redirect_1 = require("@/components/site/auth-error-redirect");
const container_1 = require("@/components/site/container");
const site_header_1 = require("@/components/site/site-header");
const site_footer_1 = require("@/components/site/site-footer");
const landing_page_body_1 = require("@/components/site/landing-page-body");
const auth_errors_1 = require("@/lib/auth-errors");
const server_1 = require("@/lib/supabase/server");
const site_1 = require("@/lib/seo/site");
exports.metadata = {
    title: "Invoice Follow-Up Software for Freelancers | Duely",
    description: "Stop chasing freelance clients out of your inbox. Track promises, partial payments, and automate follow-ups.",
    alternates: { canonical: "/for-freelancers" },
};
async function ForFreelancersPage({ searchParams, }) {
    const { error, error_description: errorDescription } = await searchParams;
    if (error || errorDescription) {
        (0, navigation_1.redirect)(`/forgot-password?error=${encodeURIComponent((0, auth_errors_1.getEmailLinkErrorMessage)(errorDescription ?? error))}`);
    }
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: { user }, } = await supabase.auth.getUser();
    if (user) {
        (0, navigation_1.redirect)("/dashboard");
    }
    const organizationJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Duely",
        url: "https://duely.in",
        logo: "https://duely.in/logo.svg",
        description: "collections management tool for freelancers and small agencies. Track outstanding invoices, payment promises, partial payments, and automate follow-ups.",
        sameAs: ["https://x.com/AbhishekU008"],
        contactPoint: {
            "@type": "ContactPoint",
            email: "abhishek@duely.in",
            contactType: "customer support",
        },
    };
    const softwareApplicationJsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Duely",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
            "@type": "Offer",
            price: "29",
            priceCurrency: "USD",
            priceSpecification: {
                "@type": "UnitPriceSpecification",
                billingDuration: "P1M",
            },
        },
        description: "Collections management tool for freelancers and small agencies. Invoice follow-up tracking, payment promise logging, partial payment management.",
    };
    const homeSchemas = [
        organizationJsonLd,
        {
            "@context": "https://schema.org",
            ...site_1.websiteSchema,
        },
        softwareApplicationJsonLd,
    ];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 flex-col overflow-x-hidden", children: [homeSchemas.map((schema, index) => ((0, jsx_runtime_1.jsx)(script_1.default, { id: `schema-${index}`, type: "application/ld+json", dangerouslySetInnerHTML: {
                    __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
                } }, index))), (0, jsx_runtime_1.jsx)(auth_error_redirect_1.AuthErrorRedirect, {}), (0, jsx_runtime_1.jsx)(site_header_1.SiteHeader, {}), (0, jsx_runtime_1.jsxs)("main", { id: "main-content", className: "flex-1", children: [(0, jsx_runtime_1.jsx)("section", { className: "py-28 sm:py-36", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "max-w-3xl text-center", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl", children: "Freelancers lose $40B+ a year to late payments. You don't have to." }), (0, jsx_runtime_1.jsx)("p", { className: "mt-6 text-lg leading-relaxed text-zinc-400 max-w-lg mx-auto", children: "Stop chasing freelance clients out of your inbox. Track promises, partial payments, and automate follow-ups." }), (0, jsx_runtime_1.jsx)("div", { className: "mt-10 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("a", { href: "/how-it-works", className: "inline-flex items-center rounded-lg bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500", children: "See how it works" }) })] }) }), (0, jsx_runtime_1.jsx)(landing_page_body_1.LandingPageBody, {})] }), (0, jsx_runtime_1.jsx)(site_footer_1.SiteFooter, {})] }));
}
