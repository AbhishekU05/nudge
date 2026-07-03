"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nudgeConfig = void 0;
exports.nudgeConfig = {
    appName: "Duely",
    supportEmail: "support@duely.in",
    adminEmails: process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(",") : ["a.upadhya05@gmail.com"],
    pricing: {
        monthly: {
            id: "price_monthly",
            price: 29,
        },
        annual: {
            id: "price_annual",
            price: 290,
        }
    },
    limits: {
        freeTrialDays: 7,
        maxTeamMembersFree: 1,
        maxTeamMembersPro: 10,
    },
    features: {
        enableXero: true,
        enableQuickbooks: true,
        enableWeeklyDigest: true,
    }
};
