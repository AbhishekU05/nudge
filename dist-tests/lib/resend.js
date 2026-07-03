"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResendClient = getResendClient;
exports.getFromEmail = getFromEmail;
require("server-only");
const resend_1 = require("resend");
const env_1 = require("@/lib/env");
function getResendClient() {
    return new resend_1.Resend((0, env_1.getRequiredEnv)("RESEND_API_KEY"));
}
function getFromEmail() {
    return (0, env_1.getRequiredEnv)("RESEND_FROM_EMAIL");
}
