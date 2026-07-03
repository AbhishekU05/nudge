"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDodoClient = getDodoClient;
exports.getDodoProductId = getDodoProductId;
exports.getDodoWebhookKey = getDodoWebhookKey;
require("server-only");
const dodopayments_1 = __importDefault(require("dodopayments"));
const env_1 = require("@/lib/env");
let client = null;
function getDodoEnvironment() {
    const value = process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode";
    if (value !== "test_mode" && value !== "live_mode") {
        throw new Error('DODO_PAYMENTS_ENVIRONMENT must be either "test_mode" or "live_mode".');
    }
    return value;
}
function getDodoClient() {
    if (!client) {
        client = new dodopayments_1.default({
            bearerToken: (0, env_1.getRequiredEnv)("DODO_PAYMENTS_API_KEY"),
            environment: getDodoEnvironment(),
        });
    }
    return client;
}
function getDodoProductId(plan) {
    if (plan === "monthly") {
        return (0, env_1.getRequiredEnv)("DODO_PAYMENTS_MONTHLY_PRODUCT_ID");
    }
    if (plan === "annual") {
        return (0, env_1.getRequiredEnv)("DODO_PAYMENTS_ANNUAL_PRODUCT_ID");
    }
    throw new Error(`Unsupported checkout plan: ${plan}`);
}
function getDodoWebhookKey() {
    return (0, env_1.getRequiredEnv)("DODO_PAYMENTS_WEBHOOK_KEY");
}
