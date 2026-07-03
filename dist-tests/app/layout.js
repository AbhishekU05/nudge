"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const script_1 = __importDefault(require("next/script"));
require("./globals.css");
exports.metadata = {
    metadataBase: new URL("https://duely.in"),
    title: {
        default: "Duely — Collect what you're owed, keep the relationship",
        template: "%s | Duely",
    },
    description: "Track outstanding invoices, payment promises, partial payments, and follow-ups. Collections management built for freelancers and agencies.",
    openGraph: {
        siteName: "Duely",
        locale: "en_US",
        type: "website",
    },
    icons: {
        icon: "/logo.svg",
    },
};
function RootLayout({ children, }) {
    const eeatSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        author: { "@type": "Organization", name: "Duely" },
        datePublished: "2024-01-01",
        dateModified: "2026-06-18",
    };
    return ((0, jsx_runtime_1.jsxs)("html", { lang: "en", className: "h-full antialiased", children: [(0, jsx_runtime_1.jsxs)("head", { children: [(0, jsx_runtime_1.jsx)("link", { rel: "preload", as: "image", href: "/logo.svg" }), (0, jsx_runtime_1.jsx)("script", { type: "application/ld+json", dangerouslySetInnerHTML: {
                            __html: JSON.stringify(eeatSchema).replace(/</g, "\\u003c"),
                        } })] }), (0, jsx_runtime_1.jsxs)("body", { className: "min-h-full flex flex-col", children: [(0, jsx_runtime_1.jsx)("a", { href: "#main-content", className: "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black", children: "Skip to main content" }), children, (0, jsx_runtime_1.jsx)(script_1.default, { async: true, src: "https://www.googletagmanager.com/gtag/js?id=G-QMCVL1RL2L", strategy: "afterInteractive" }), (0, jsx_runtime_1.jsx)(script_1.default, { async: true, id: "google-analytics", strategy: "afterInteractive", children: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QMCVL1RL2L');
          ` }), (0, jsx_runtime_1.jsx)(script_1.default, { async: true, id: "microsoft-clarity", strategy: "afterInteractive", children: `
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wzuugmsshn");
          ` })] })] }));
}
