"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GlobalError;
const jsx_runtime_1 = require("react/jsx-runtime");
const error_1 = __importDefault(require("next/error"));
const react_1 = require("react");
function GlobalError({ error, }) {
    (0, react_1.useEffect)(() => {
        console.error(error);
    }, [error]);
    return ((0, jsx_runtime_1.jsx)("html", { children: (0, jsx_runtime_1.jsx)("body", { children: (0, jsx_runtime_1.jsx)(error_1.default, { statusCode: 500 }) }) }));
}
