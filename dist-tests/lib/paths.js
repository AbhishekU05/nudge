"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSafeNextPath = getSafeNextPath;
exports.buildPathWithQuery = buildPathWithQuery;
function getSafeNextPath(value, fallback = "/dashboard") {
    if (!value ||
        !value.startsWith("/") ||
        value.startsWith("//") ||
        value.startsWith("/\\")) {
        return fallback;
    }
    try {
        const parsed = new URL(value, "http://localhost");
        if (parsed.origin !== "http://localhost") {
            return fallback;
        }
    }
    catch {
        return fallback;
    }
    return value;
}
function buildPathWithQuery(pathname, params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value) {
            searchParams.set(key, value);
        }
    }
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
}
