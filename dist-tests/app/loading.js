"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Loading;
const jsx_runtime_1 = require("react/jsx-runtime");
const container_1 = require("@/components/site/container");
function Skeleton({ className = "" }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: `animate-pulse rounded-xl border border-white/10 bg-white/[0.04] ${className}` }));
}
function Loading() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex min-h-screen flex-col", children: [(0, jsx_runtime_1.jsx)("div", { className: "border-b border-border bg-background/80", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "flex h-16 items-center justify-between", children: [(0, jsx_runtime_1.jsx)(Skeleton, { className: "h-7 w-28" }), (0, jsx_runtime_1.jsx)(Skeleton, { className: "h-8 w-40" })] }) }), (0, jsx_runtime_1.jsx)("main", { id: "main-content", className: "flex-1", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "py-8 sm:py-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8 space-y-4", children: [(0, jsx_runtime_1.jsx)(Skeleton, { className: "h-7 w-32" }), (0, jsx_runtime_1.jsx)(Skeleton, { className: "h-12 w-full max-w-xl" }), (0, jsx_runtime_1.jsx)(Skeleton, { className: "h-5 w-full max-w-2xl" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]", children: [(0, jsx_runtime_1.jsx)(Skeleton, { className: "h-96" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-5", children: [(0, jsx_runtime_1.jsx)(Skeleton, { className: "h-64" }), (0, jsx_runtime_1.jsx)(Skeleton, { className: "h-72" })] })] })] }) })] }));
}
