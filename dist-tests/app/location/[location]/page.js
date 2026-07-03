"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStaticParams = generateStaticParams;
exports.generateMetadata = generateMetadata;
exports.default = LocationPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const seo_data_1 = require("@/lib/seo-data");
const seo_page_template_1 = __importDefault(require("@/components/site/seo-page-template"));
const navigation_1 = require("next/navigation");
function generateStaticParams() {
    return Object.keys(seo_data_1.locations).map((location) => ({
        location,
    }));
}
async function generateMetadata({ params }) {
    const { location } = await params;
    const data = seo_data_1.locations[location];
    if (!data)
        return {};
    return {
        title: data.title,
        description: data.metaDescription,
        alternates: {
            canonical: `https://duely.in/location/${location}`,
        },
        openGraph: {
            title: data.title,
            description: data.metaDescription,
            url: `https://duely.in/location/${location}`,
            type: "website",
        },
    };
}
async function LocationPage({ params }) {
    const { location } = await params;
    const data = seo_data_1.locations[location];
    if (!data) {
        (0, navigation_1.notFound)();
    }
    return (0, jsx_runtime_1.jsx)(seo_page_template_1.default, { data: data });
}
