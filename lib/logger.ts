import { randomUUID } from "crypto";

type LogLevel = "info" | "warn" | "error";

interface BaseLogData {
  category: "api" | "error" | "payment" | "action" | "cron" | "external";
  timestamp?: string;
  request_id?: string;
  user_id?: string;
  [key: string]: any;
}

export const logger = {
  log(level: LogLevel, data: BaseLogData) {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      ...data,
    };

    // Sanitize common sensitive fields
    if (payload.token) payload.token = "[REDACTED]";
    if (payload.password) payload.password = "[REDACTED]";
    if (payload.secret) payload.secret = "[REDACTED]";

    const logString = JSON.stringify(payload);

    if (level === "error") {
      console.error(logString);
    } else if (level === "warn") {
      console.warn(logString);
    } else {
      console.log(logString);
    }
  },

  api(data: { route: string; method: string; status: number; duration: number; user_id?: string; request_id?: string }) {
    this.log("info", { category: "api", ...data });
  },

  error(data: { message: string; stack?: string; context: string; user_id?: string; request_id?: string; [key: string]: any }) {
    this.log("error", { category: "error", ...data });
  },

  payment(data: { event_type: string; status: string; user_id?: string; subscription_id?: string; payment_id?: string; request_id?: string; [key: string]: any }) {
    this.log("info", { category: "payment", ...data });
  },

  action(data: { action_name: string; reminder_id?: string; user_id?: string; success: boolean; error?: string; request_id?: string }) {
    const level = data.success ? "info" : "error";
    this.log(level, { category: "action", ...data });
  },

  cron(data: { job_name: string; status: "start" | "end" | "error"; processed?: number; success_count?: number; failure_count?: number; duration?: number; error?: string; request_id?: string }) {
    const level = data.status === "error" ? "error" : "info";
    this.log(level, { category: "cron", ...data });
  },

  external(data: { service: string; action: string; success: boolean; latency?: number; error?: string; request_id?: string; user_id?: string }) {
    const level = data.success ? "info" : "error";
    this.log(level, { category: "external", ...data });
  }
};
