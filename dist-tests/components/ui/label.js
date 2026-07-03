"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Label = Label;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("@/lib/utils");
function Label({ className, ...props }) {
    return ((0, jsx_runtime_1.jsx)("label", { className: (0, utils_1.cn)("text-sm font-medium tracking-tight text-zinc-200", className), ...props }));
}
