"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Container = Container;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("@/lib/utils");
function Container({ className, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className), ...props }));
}
