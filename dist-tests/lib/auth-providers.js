"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGoogleAuthEnabled = isGoogleAuthEnabled;
require("server-only");
function isGoogleAuthEnabled() {
    return process.env.GOOGLE_AUTH_ENABLED === "true";
}
