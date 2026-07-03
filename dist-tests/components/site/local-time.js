"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalTime = LocalTime;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function LocalTime({ value, fallback = "Not sent yet", }) {
    const [mounted, setMounted] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);
    if (!value) {
        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: fallback });
    }
    const date = new Date(value);
    if (!mounted) {
        // Server-side: render empty or a skeleton to prevent layout shift mismatch,
        // or render the UTC but we must ensure it replaces on client.
        // If we return the formatted server time here, we STILL have a mismatch because
        // the client first-render MUST match the server.
        return ((0, jsx_runtime_1.jsx)("span", { suppressHydrationWarning: true, className: "opacity-0", children: date.toLocaleString("en-US", {
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                month: "short",
                timeZone: "UTC",
            }) }));
    }
    const formattedClient = date.toLocaleString(undefined, {
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        month: "short",
    });
    return (0, jsx_runtime_1.jsx)("span", { children: formattedClient });
}
