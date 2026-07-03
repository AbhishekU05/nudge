"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = Page;
const jsx_runtime_1 = require("react/jsx-runtime");
const seo_index_template_1 = __importDefault(require("@/components/site/seo-index-template"));
const seo_data_1 = require("@/lib/seo-data");
exports.metadata = {
    title: "Duely Use Cases | Duely",
    description: "Discover the different ways you can use Duely to optimize your cash flow.",
};
function Page() {
    const links = Object.keys(seo_data_1.useCases).map(key => ({
        href: `/use-case/${key}`,
        label: seo_data_1.useCases[key].title,
        description: seo_data_1.useCases[key].metaDescription
    }));
    return ((0, jsx_runtime_1.jsx)(seo_index_template_1.default, { title: "Duely Use Cases", description: "Discover the different ways you can use Duely to optimize your cash flow.", links: links }));
}
