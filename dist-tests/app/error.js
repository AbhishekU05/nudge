"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Error;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function Error({ error, reset, }) {
    (0, react_1.useEffect)(() => {
        console.error(error);
    }, [error]);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center justify-center min-h-screen p-4 text-center", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold mb-4", children: "Something went wrong!" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mb-8 max-w-md", children: "An unexpected error occurred. Our team has been notified and is looking into it." }), (0, jsx_runtime_1.jsx)("button", { onClick: () => reset(), className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors", children: "Try again" })] }));
}
