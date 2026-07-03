"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = CollectionsMaturityAssessmentPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const collections_maturity_assessment_1 = require("@/app/tools/collections-maturity-assessment/collections-maturity-assessment");
exports.metadata = {
    alternates: {
        canonical: "/tools/collections-maturity-assessment",
    },
    description: "Evaluate the maturity of your agency's collections process. Get a personalized maturity score, category breakdown, and improvement roadmap.",
    openGraph: {
        description: "Evaluate the maturity of your agency's collections process and identify operational weaknesses.",
        title: "Collections Maturity Assessment",
        type: "website",
        url: "https://duely.in/tools/collections-maturity-assessment",
    },
    title: "Collections Maturity Assessment",
};
function CollectionsMaturityAssessmentPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        applicationCategory: "BusinessApplication",
        description: "Evaluate the maturity of your agency's collections process and identify operational weaknesses.",
        name: "Collections Maturity Assessment",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "INR",
        },
        operatingSystem: "Any",
        provider: {
            "@type": "Organization",
            name: "Duely",
            url: "https://duely.in",
        },
        url: "https://duely.in/tools/collections-maturity-assessment",
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("script", { type: "application/ld+json", dangerouslySetInnerHTML: {
                    __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
                } }), (0, jsx_runtime_1.jsx)(collections_maturity_assessment_1.CollectionsMaturityAssessment, {})] }));
}
