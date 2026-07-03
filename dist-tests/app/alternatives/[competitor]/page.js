"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStaticParams = generateStaticParams;
exports.generateMetadata = generateMetadata;
exports.default = CompetitorPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const seo_data_1 = require("@/lib/seo-data");
const seo_page_template_1 = __importDefault(require("@/components/site/seo-page-template"));
const navigation_1 = require("next/navigation");
function generateStaticParams() {
    return Object.keys(seo_data_1.competitors).map((competitor) => ({
        competitor: `duely-vs-${competitor}`,
    }));
}
async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const competitorId = resolvedParams.competitor.replace('duely-vs-', '');
    const data = seo_data_1.competitors[competitorId];
    if (!data)
        return {};
    return {
        title: data.title,
        description: data.metaDescription,
        alternates: {
            canonical: `https://duely.in/alternatives/${resolvedParams.competitor}`,
        },
        openGraph: {
            title: data.title,
            description: data.metaDescription,
            url: `https://duely.in/alternatives/${resolvedParams.competitor}`,
            type: "website",
        },
    };
}
async function CompetitorPage({ params }) {
    const resolvedParams = await params;
    const competitorId = resolvedParams.competitor.replace('duely-vs-', '');
    const data = seo_data_1.competitors[competitorId];
    if (!data) {
        (0, navigation_1.notFound)();
    }
    return (0, jsx_runtime_1.jsx)(seo_page_template_1.default, { data: data });
}
