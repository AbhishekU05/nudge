"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websiteSchema = exports.organizationSchema = exports.SITE_NAME = exports.SITE_URL = void 0;
exports.SITE_URL = "https://duely.in";
exports.SITE_NAME = "Duely";
exports.organizationSchema = {
    "@type": "Organization",
    name: exports.SITE_NAME,
    url: exports.SITE_URL,
    logo: `${exports.SITE_URL}/logo.svg`,
    description: "Duely is a collections management tool for freelancers, small agencies, and independent consultants. Track outstanding invoices, payment promises, partial payments, and automated follow-ups.",
    sameAs: ["https://x.com/AbhishekU008"],
};
exports.websiteSchema = {
    "@type": "WebSite",
    name: exports.SITE_NAME,
    url: exports.SITE_URL,
    description: "Collections management for freelancers and agencies. Track invoices, payment promises, and send reminders from your own Gmail.",
    potentialAction: {
        "@type": "SearchAction",
        target: {
            "@type": "EntryPoint",
            urlTemplate: `${exports.SITE_URL}/articles?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
    },
};
