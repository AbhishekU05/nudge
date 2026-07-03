"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Loading;
const jsx_runtime_1 = require("react/jsx-runtime");
const container_1 = require("@/components/site/container");
function Skeleton({ className = "" }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: `animate-pulse rounded-xl border border-white/10 bg-white/[0.04] ${className}` }));
}
function Loading() {
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex min-h-screen flex-col w-full", children: (0, jsx_runtime_1.jsx)("main", { id: "main-content", className: "flex-1 w-full", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "py-8 sm:py-10 max-w-[1600px]", children: [(0, jsx_runtime_1.jsx)("div", { className: "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 w-full", children: [(0, jsx_runtime_1.jsx)(Skeleton, { className: "h-10 w-48" }), (0, jsx_runtime_1.jsx)(Skeleton, { className: "h-6 w-96 max-w-full" })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-5", children: [(0, jsx_runtime_1.jsx)(Skeleton, { className: "h-[120px] w-full" }), (0, jsx_runtime_1.jsx)(Skeleton, { className: "h-[400px] w-full" })] })] }) }) }));
}
