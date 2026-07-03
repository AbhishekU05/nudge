"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = exports.runtime = void 0;
exports.POST = POST;
const node_crypto_1 = __importDefault(require("node:crypto"));
const server_1 = require("next/server");
const dodo_1 = require("@/lib/dodo");
const dodo_webhooks_1 = require("@/lib/dodo-webhooks");
const logger_1 = require("@/lib/logger");
const admin_1 = require("@/lib/supabase/admin");
exports.runtime = "nodejs";
exports.dynamic = "force-dynamic";
async function POST(request) {
    const requestId = node_crypto_1.default.randomUUID();
    const webhookId = request.headers.get("webhook-id");
    const webhookSignature = request.headers.get("webhook-signature");
    const webhookTimestamp = request.headers.get("webhook-timestamp");
    if (!webhookId || !webhookSignature || !webhookTimestamp) {
        return server_1.NextResponse.json({ error: "Missing webhook headers" }, { status: 400 });
    }
    const body = await request.text();
    let event;
    try {
        event = (0, dodo_1.getDodoClient)().webhooks.unwrap(body, {
            headers: {
                "webhook-id": webhookId,
                "webhook-signature": webhookSignature,
                "webhook-timestamp": webhookTimestamp,
            },
            key: (0, dodo_1.getDodoWebhookKey)(),
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: error instanceof Error ? error.message : "Invalid Dodo webhook signature",
            context: "dodo:webhook:verify",
            request_id: requestId,
        });
        return server_1.NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }
    try {
        const result = await (0, dodo_webhooks_1.processDodoWebhookEvent)((0, admin_1.createSupabaseAdminClient)(), webhookId, event);
        logger_1.logger.payment({
            event_type: event.type,
            status: result.duplicate ? "duplicate" : "processed",
            request_id: requestId,
            organization_id: result.organizationId ?? undefined,
        });
        return server_1.NextResponse.json({ received: true, duplicate: result.duplicate });
    }
    catch (error) {
        logger_1.logger.error({
            message: error instanceof Error ? error.message : "Dodo webhook processing failed",
            context: "dodo:webhook:process",
            request_id: requestId,
            event_type: event.type,
        });
        return server_1.NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}
