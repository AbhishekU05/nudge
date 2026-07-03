"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = Card;
exports.CardHeader = CardHeader;
exports.CardTitle = CardTitle;
exports.CardDescription = CardDescription;
exports.CardContent = CardContent;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("@/lib/utils");
function Card({ className, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)("rounded-2xl border border-border bg-card text-card-foreground", className), ...props }));
}
function CardHeader({ className, ...props }) {
    return (0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)("p-6 pb-3", className), ...props });
}
function CardTitle({ className, ...props }) {
    return ((0, jsx_runtime_1.jsx)("h2", { className: (0, utils_1.cn)("text-lg font-semibold tracking-tight text-zinc-50", className), ...props }));
}
function CardDescription({ className, ...props }) {
    return ((0, jsx_runtime_1.jsx)("p", { className: (0, utils_1.cn)("mt-1 text-sm leading-6 text-muted-foreground", className), ...props }));
}
function CardContent({ className, ...props }) {
    return (0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)("p-6 pt-3", className), ...props });
}
