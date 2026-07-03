"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStaticParams = generateStaticParams;
exports.generateMetadata = generateMetadata;
exports.default = UseCasePage;
const jsx_runtime_1 = require("react/jsx-runtime");
const seo_data_1 = require("@/lib/seo-data");
const seo_page_template_1 = __importDefault(require("@/components/site/seo-page-template"));
const navigation_1 = require("next/navigation");
function generateStaticParams() {
    return Object.keys(seo_data_1.useCases).map((usecase) => ({
        usecase,
    }));
}
async function generateMetadata({ params }) {
    const { usecase } = await params;
    const data = seo_data_1.useCases[usecase];
    if (!data)
        return {};
    return {
        title: data.title,
        description: data.metaDescription,
        alternates: {
            canonical: `https://duely.in/use-case/${usecase}`,
        },
        openGraph: {
            title: data.title,
            description: data.metaDescription,
            url: `https://duely.in/use-case/${usecase}`,
            type: "website",
        },
    };
}
async function UseCasePage({ params }) {
    const { usecase } = await params;
    const data = seo_data_1.useCases[usecase];
    if (!data) {
        (0, navigation_1.notFound)();
    }
    return (0, jsx_runtime_1.jsx)(seo_page_template_1.default, { data: data });
}
