"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = PaymentLeakCalculatorPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const payment_leak_calculator_1 = require("@/app/tools/payment-leak-calculator/payment-leak-calculator");
exports.metadata = {
    alternates: {
        canonical: "/tools/payment-leak-calculator",
    },
    description: "Estimate how much cash your agency has tied up in delayed client payments and get a personalized collections report.",
    openGraph: {
        description: "Estimate how much cash your agency has tied up in delayed client payments and get a personalized collections report.",
        title: "Agency Payment Leak Estimator",
        type: "website",
        url: "https://duely.in/tools/payment-leak-calculator",
    },
    title: "Agency Payment Leak Estimator",
};
function PaymentLeakCalculatorPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        applicationCategory: "BusinessApplication",
        description: "Estimate how much cash your agency has tied up in delayed client payments and get a personalized collections report.",
        name: "Agency Payment Leak Estimator",
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
        url: "https://duely.in/tools/payment-leak-calculator",
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("script", { type: "application/ld+json", dangerouslySetInnerHTML: {
                    __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
                } }), (0, jsx_runtime_1.jsx)(payment_leak_calculator_1.PaymentLeakCalculator, {})] }));
}
