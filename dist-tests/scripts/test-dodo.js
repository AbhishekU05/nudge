"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dodopayments_1 = require("dodopayments");
const fs = __importStar(require("fs"));
const envStr = fs.readFileSync(".env.local", "utf-8");
envStr.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        process.env[match[1]] = match[2];
    }
});
async function testDodo() {
    console.log("Initializing Dodo...");
    console.log("API Key exists:", !!process.env.DODO_PAYMENTS_API_KEY);
    console.log("Monthly Product ID:", process.env.DODO_PAYMENTS_MONTHLY_PRODUCT_ID);
    const client = new dodopayments_1.DodoPayments({
        bearerToken: process.env.DODO_PAYMENTS_API_KEY,
        environment: process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
    });
    try {
        const session = await client.checkoutSessions.create({
            product_cart: [{ product_id: process.env.DODO_PAYMENTS_MONTHLY_PRODUCT_ID || "prod_123", quantity: 1 }],
            return_url: "http://localhost:3000/settings/billing?success=true",
            customer: {
                email: "test@example.com",
                name: "Test User",
            },
        });
        console.log("Success! Session:", session);
    }
    catch (error) {
        console.error("Dodo API Error:");
        console.error(error);
    }
}
testDodo();
