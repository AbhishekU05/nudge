"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthErrorRedirect = AuthErrorRedirect;
const react_1 = require("react");
const auth_errors_1 = require("@/lib/auth-errors");
function AuthErrorRedirect() {
    (0, react_1.useEffect)(() => {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.startsWith("#")
            ? window.location.hash.slice(1)
            : window.location.hash);
        const description = params.get("error_description") ?? hashParams.get("error_description");
        const error = params.get("error") ?? hashParams.get("error");
        if (!description && !error) {
            return;
        }
        const target = new URL("/forgot-password", window.location.origin);
        target.searchParams.set("error", (0, auth_errors_1.getEmailLinkErrorMessage)(description ?? error));
        window.location.replace(target.toString());
    }, []);
    return null;
}
