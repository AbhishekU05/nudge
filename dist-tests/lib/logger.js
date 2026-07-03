"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const node_1 = require("@logtail/node");
const logtail = process.env.LOGTAIL_SOURCE_TOKEN
    ? new node_1.Logtail(process.env.LOGTAIL_SOURCE_TOKEN)
    : null;
exports.logger = {
    log(level, data) {
        const payload = {
            timestamp: new Date().toISOString(),
            level,
            ...data,
        };
        // Sanitize common sensitive fields
        if (payload.token)
            payload.token = "[REDACTED]";
        if (payload.password)
            payload.password = "[REDACTED]";
        if (payload.secret)
            payload.secret = "[REDACTED]";
        const logString = JSON.stringify(payload);
        if (level === "error") {
            console.error(logString);
            // Send error to BetterStack
            if (logtail) {
                logtail.error(String(payload.message || payload.error || "Unknown Error"), payload);
            }
        }
        else if (level === "warn") {
            console.warn(logString);
            if (logtail)
                logtail.warn(String(payload.message || "Warning"), payload);
        }
        else {
            console.log(logString);
            if (logtail)
                logtail.info(String(payload.message || "Info"), payload);
        }
    },
    api(data) {
        this.log("info", { category: "api", ...data });
    },
    error(data) {
        this.log("error", { category: "error", ...data });
    },
    payment(data) {
        this.log("info", { category: "payment", ...data });
    },
    action(data) {
        const level = data.success ? "info" : "error";
        this.log(level, { category: "action", ...data });
    },
    cron(data) {
        const level = data.status === "error" ? "error" : "info";
        this.log(level, { category: "cron", ...data });
    },
    external(data) {
        const level = data.success ? "info" : "error";
        this.log(level, { category: "external", ...data });
    }
};
