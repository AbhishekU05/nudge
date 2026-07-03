"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardLoading;
const jsx_runtime_1 = require("react/jsx-runtime");
/*
 * loaded quickly by browser and replaced later by actual content
 */
const container_1 = require("@/components/site/container");
// normal rounded box
function Skeleton({ className = "" }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: `animate-pulse rounded-xl border border-white/10 bg-white/[0.04] ${className}` }));
}
// creates skeleton of the dashboard using the skeleton box
function DashboardLoading() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex min-h-screen flex-col", children: [(0, jsx_runtime_1.jsx)("div", { className: "sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "flex h-16 items-center justify-between", children: [(0, jsx_runtime_1.jsx)(Skeleton, { className: "h-7 w-28" }), (0, jsx_runtime_1.jsx)(Skeleton, { className: "h-8 w-44" })] }) }), (0, jsx_runtime_1.jsx)("main", { id: "main-content", className: "flex-1", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "py-8 sm:py-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)(Skeleton, { className: "h-7 w-36" }), (0, jsx_runtime_1.jsx)(Skeleton, { className: "h-12 w-52" }), (0, jsx_runtime_1.jsx)(Skeleton, { className: "h-5 w-full max-w-xl" })] }), (0, jsx_runtime_1.jsx)(Skeleton, { className: "h-24 w-full lg:w-80" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-3 rounded-2xl border border-border bg-white/[0.035] p-6", children: [(0, jsx_runtime_1.jsx)(Skeleton, { className: "h-8 w-48" }), (0, jsx_runtime_1.jsx)(Skeleton, { className: "h-5 w-72" }), (0, jsx_runtime_1.jsx)(Skeleton, { className: "h-36" }), (0, jsx_runtime_1.jsx)(Skeleton, { className: "h-36" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-5", children: [(0, jsx_runtime_1.jsx)(Skeleton, { className: "h-72" }), (0, jsx_runtime_1.jsx)(Skeleton, { className: "h-80" })] })] })] }) })] }));
}
