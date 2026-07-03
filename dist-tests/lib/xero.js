"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getXeroCallbackUrl = getXeroCallbackUrl;
exports.createXeroState = createXeroState;
exports.buildXeroConsentUrl = buildXeroConsentUrl;
exports.getValidXeroClient = getValidXeroClient;
exports.completeXeroOAuthCallback = completeXeroOAuthCallback;
exports.syncXeroInvoicesForOrg = syncXeroInvoicesForOrg;
exports.getXeroBankAccounts = getXeroBankAccounts;
exports.revokeXeroIntegration = revokeXeroIntegration;
/* eslint-disable */
require("server-only");
const crypto_1 = __importDefault(require("crypto"));
const xero_node_1 = require("xero-node");
const env_1 = require("@/lib/env");
const reminder_1 = require("@/lib/email/reminder");
const logger_1 = require("@/lib/logger");
const admin_1 = require("@/lib/supabase/admin");
const XERO_PROVIDER = "xero";
const XERO_SCOPES = [
    "openid",
    "profile",
    "email",
    "accounting.invoices.read",
    "accounting.contacts.read",
    "offline_access",
];
const STATE_MAX_AGE_MS = 10 * 60 * 1000;
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;
function getXeroClientId() { return (0, env_1.getRequiredEnv)("XERO_CLIENT_ID"); }
function getXeroClientSecret() { return (0, env_1.getRequiredEnv)("XERO_CLIENT_SECRET"); }
function getXeroStateSecret() { return process.env.XERO_STATE_SECRET ?? (0, env_1.getRequiredEnv)("SUPABASE_SERVICE_ROLE_KEY"); }
function getXeroCallbackUrl() {
    return `${(0, reminder_1.getAppUrl)()}/api/integrations/xero/callback`;
}
function createXeroClient(state) {
    return new xero_node_1.XeroClient({
        clientId: getXeroClientId(),
        clientSecret: getXeroClientSecret(),
        redirectUris: [getXeroCallbackUrl()],
        scopes: XERO_SCOPES,
        state,
    });
}
function signStatePayload(encodedPayload) {
    return crypto_1.default.createHmac("sha256", getXeroStateSecret()).update(encodedPayload).digest("base64url");
}
function createXeroState(userId) {
    const payload = { createdAt: Date.now(), nonce: crypto_1.default.randomUUID(), userId };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encodedPayload}.${signStatePayload(encodedPayload)}`;
}
function verifyXeroState(state) {
    const [encodedPayload, signature] = state.split(".");
    if (!encodedPayload || !signature)
        throw new Error("Invalid Xero OAuth state.");
    const expected = signStatePayload(encodedPayload);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !crypto_1.default.timingSafeEqual(actualBuffer, expectedBuffer)) {
        throw new Error("Invalid Xero OAuth state signature.");
    }
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!payload.userId || Date.now() - payload.createdAt > STATE_MAX_AGE_MS)
        throw new Error("Expired Xero OAuth state.");
    return payload;
}
async function buildXeroConsentUrl(userId) {
    const state = createXeroState(userId);
    return createXeroClient(state).buildConsentUrl();
}
function getTokenExpiresAt(tokenSet) {
    const token = tokenSet;
    if (token.expires_at)
        return new Date(token.expires_at * 1000).toISOString();
    const expiresInSeconds = token.expires_in ?? 1800;
    return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
}
function requireTokenValues(tokenSet) {
    if (!tokenSet.access_token || !tokenSet.refresh_token)
        throw new Error("Xero did not return a complete OAuth token set.");
    return { accessToken: tokenSet.access_token, expiresAt: getTokenExpiresAt(tokenSet), refreshToken: tokenSet.refresh_token };
}
function storedTokenSet(integration) {
    return { access_token: integration.access_token, expires_at: Math.floor(new Date(integration.expires_at).getTime() / 1000), refresh_token: integration.refresh_token };
}
function tokenNeedsRefresh(expiresAt) {
    return new Date(expiresAt).getTime() - Date.now() <= TOKEN_REFRESH_SKEW_MS;
}
async function getValidXeroClient(integration) {
    if (!tokenNeedsRefresh(integration.expires_at)) {
        const xero = new xero_node_1.XeroClient();
        xero.setTokenSet(storedTokenSet(integration));
        return { integration, xero };
    }
    const xero = new xero_node_1.XeroClient();
    const refreshedTokenSet = await xero.refreshWithRefreshToken(getXeroClientId(), getXeroClientSecret(), integration.refresh_token);
    const tokenValues = requireTokenValues(refreshedTokenSet);
    const updatedIntegration = { ...integration, access_token: tokenValues.accessToken, expires_at: tokenValues.expiresAt, refresh_token: tokenValues.refreshToken };
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    const { error } = await supabase.from("integrations").update({ access_token: updatedIntegration.access_token, expires_at: updatedIntegration.expires_at, refresh_token: updatedIntegration.refresh_token })
        .eq("organization_id", integration.organization_id).eq("provider", XERO_PROVIDER);
    if (error)
        throw new Error(error.message);
    return { integration: updatedIntegration, xero };
}
async function completeXeroOAuthCallback(callbackUrl, state) {
    const statePayload = verifyXeroState(state);
    const xero = createXeroClient(state);
    const tokenSet = await xero.apiCallback(callbackUrl);
    const tokenValues = requireTokenValues(tokenSet);
    const tenants = await xero.updateTenants(false);
    const tenantId = tenants[0]?.tenantId;
    if (!tenantId)
        throw new Error("No Xero organisation was connected.");
    // For connecting, the auth.userId is actually passed in statePayload.userId. We should map it to organization_id.
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    // Find org id
    const { data: member } = await supabase.from("organization_members").select("organization_id").eq("user_id", statePayload.userId).single();
    if (!member)
        throw new Error("User has no organization");
    const { error } = await supabase.from("integrations").upsert({ organization_id: member.organization_id, provider: XERO_PROVIDER, access_token: tokenValues.accessToken, refresh_token: tokenValues.refreshToken, expires_at: tokenValues.expiresAt, tenant_id: tenantId }, { onConflict: "organization_id,provider" });
    if (error)
        throw new Error(error.message);
    return syncXeroInvoicesForOrg(member.organization_id);
}
function normalizeEmail(email) {
    return email?.trim().toLowerCase() || null;
}
function toIsoDate(value) {
    if (!value)
        return null;
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))
        return value.slice(0, 10);
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()))
        return null;
    return parsed.toISOString().slice(0, 10);
}
function getWorkflowStatus(invoice) {
    const amountDue = Number(invoice.amountDue ?? 0);
    const amountPaid = Number(invoice.amountPaid ?? 0);
    const dueDate = toIsoDate(invoice.dueDate);
    if (String(invoice.status) === "PAID" || amountDue <= 0)
        return "paid";
    if (amountPaid > 0)
        return "partial";
    if (dueDate && dueDate < new Date().toISOString().slice(0, 10))
        return "overdue";
    return "outstanding";
}
function getInvoiceTotal(invoice) {
    const total = Number(invoice.total ?? 0);
    if (total > 0)
        return Math.round(total * 100) / 100;
    const amountDue = Number(invoice.amountDue ?? 0);
    const amountPaid = Number(invoice.amountPaid ?? 0);
    return Math.round((amountDue + amountPaid) * 100) / 100;
}
async function getXeroIntegration(organizationId) {
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    const { data, error } = await supabase.from("integrations").select("*").eq("organization_id", organizationId).eq("provider", XERO_PROVIDER).maybeSingle();
    if (error)
        throw new Error(error.message);
    return data;
}
async function fetchAllXeroInvoices(xero, tenantId) {
    const invoices = [];
    let page = 1;
    while (true) {
        const response = await xero.accountingApi.getInvoices(tenantId, undefined, 'Type=="ACCREC"', "UpdatedDateUTC DESC", undefined, undefined, undefined, undefined, page, false, undefined, undefined, false, 100);
        invoices.push(...(response.body.invoices ?? []));
        if ((response.body.invoices?.length || 0) < 100)
            break;
        page += 1;
    }
    return invoices;
}
async function loadExistingXeroInvoices(organizationId, invoiceIds) {
    if (invoiceIds.length === 0)
        return new Map();
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    const { data, error } = await supabase.from("invoices").select("id, client_id, xero_id, amount, status, updated_at").eq("organization_id", organizationId).in("xero_id", invoiceIds);
    if (error)
        throw new Error(error.message);
    return new Map((data ?? []).map((row) => [row.xero_id ?? "", row]));
}
async function syncXeroInvoicesForOrg(organizationId) {
    const integration = await getXeroIntegration(organizationId);
    if (!integration)
        throw new Error("Xero is not connected.");
    const { xero } = await getValidXeroClient(integration);
    const invoices = await fetchAllXeroInvoices(xero, integration.tenant_id);
    const invoiceIds = invoices.map((invoice) => invoice.invoiceID).filter((invoiceId) => Boolean(invoiceId));
    const existingByInvoiceId = await loadExistingXeroInvoices(organizationId, invoiceIds);
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    const { data: clientsData } = await supabase.from("clients").select("id, name, email").eq("organization_id", organizationId);
    const clientsMap = new Map();
    for (const client of clientsData || []) {
        if (client.email)
            clientsMap.set(client.email.toLowerCase(), client);
        if (client.name)
            clientsMap.set(client.name.toLowerCase(), client);
    }
    const result = { imported: 0, markedPaid: 0, skipped: 0, totalInvoices: invoices.length, updated: 0 };
    const newPayments = [];
    for (const invoice of invoices) {
        const invoiceId = invoice.invoiceID;
        if (!invoiceId) {
            result.skipped += 1;
            continue;
        }
        const contactName = invoice.contact?.name?.trim() || "Xero customer";
        const email = normalizeEmail(invoice.contact?.emailAddress) || "";
        const amountOwed = getInvoiceTotal(invoice);
        if (amountOwed <= 0) {
            result.skipped += 1;
            continue;
        }
        let clientRecord = email ? clientsMap.get(email.toLowerCase()) : undefined;
        if (!clientRecord)
            clientRecord = clientsMap.get(contactName.toLowerCase());
        if (!clientRecord) {
            const { data: client, error: clientError } = await supabase.from("clients").insert({ organization_id: organizationId, name: contactName, email: email }).select("id").single();
            if (clientError)
                throw new Error(clientError.message);
            clientRecord = { id: client.id };
            if (email)
                clientsMap.set(email.toLowerCase(), clientRecord);
            clientsMap.set(contactName.toLowerCase(), clientRecord);
        }
        const status = getWorkflowStatus(invoice);
        const existing = existingByInvoiceId.get(invoiceId);
        const xeroUpdatedDate = invoice.updatedDateUTC ? new Date(invoice.updatedDateUTC) : new Date(0);
        const payload = {
            organization_id: organizationId,
            client_id: clientRecord.id,
            amount: amountOwed,
            currency: String(invoice.currencyCode ?? "USD"),
            due_date: toIsoDate(invoice.dueDate),
            status: status,
            xero_id: invoiceId,
            updated_at: new Date().toISOString()
        };
        if (existing) {
            const duelyUpdatedDate = new Date(existing.updated_at || 0);
            // If Duely's invoice is newer, we skip overwriting from Xero to respect the Dual Sync Truth rule!
            if (duelyUpdatedDate > xeroUpdatedDate) {
                result.skipped += 1;
                continue;
            }
            const { error } = await supabase.from("invoices").update(payload).eq("id", existing.id);
            if (error)
                throw new Error(error.message);
            if (status === "paid" && existing.status !== "paid")
                result.markedPaid += 1;
            else
                result.updated += 1;
            // Extract new payments logic (naive calculation based on amount paid in Xero)
            const amountPaid = Number(invoice.amountPaid || 0);
            if (amountPaid > 0 && status === "paid" && existing.status !== "paid") {
                newPayments.push({
                    organization_id: organizationId,
                    invoice_id: existing.id,
                    amount: amountPaid,
                    currency: payload.currency,
                    payment_date: toIsoDate(invoice.fullyPaidOnDate) || new Date().toISOString().substring(0, 10),
                    payment_method: "xero_sync"
                });
            }
            continue;
        }
        const { data: newInvoice, error } = await supabase.from("invoices").insert(payload).select("id").single();
        if (error)
            throw new Error(error.message);
        const amountPaid = Number(invoice.amountPaid || 0);
        if (amountPaid > 0 || status === "paid") {
            newPayments.push({
                organization_id: organizationId,
                invoice_id: newInvoice.id,
                amount: amountPaid > 0 ? amountPaid : amountOwed,
                currency: payload.currency,
                payment_date: toIsoDate(invoice.fullyPaidOnDate) || new Date().toISOString().substring(0, 10),
                payment_method: "xero_sync"
            });
        }
        result.imported += 1;
    }
    if (newPayments.length > 0) {
        const { error: logsError } = await supabase.from("payments").insert(newPayments);
        if (logsError) {
            logger_1.logger.error({ message: "Failed to insert payments from Xero sync", context: "syncXeroInvoicesForOrg", error: logsError.message, organization_id: organizationId });
        }
    }
    const { error: syncError } = await supabase.from("integrations").update({ last_synced_at: new Date().toISOString() }).eq("organization_id", organizationId).eq("provider", XERO_PROVIDER);
    if (syncError)
        throw new Error(syncError.message);
    logger_1.logger.external({ service: "Xero", action: "sync_invoices", success: true, organization_id: organizationId });
    return result;
}
async function getXeroBankAccounts(organizationId) {
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    const { data: integration } = await supabase.from("integrations").select("*").eq("organization_id", organizationId).eq("provider", "xero").maybeSingle();
    if (!integration || !integration.tenant_id)
        return [];
    try {
        const { xero } = await getValidXeroClient(integration);
        const response = await xero.accountingApi.getAccounts(integration.tenant_id, undefined, 'Type=="BANK"');
        const accounts = response.body.accounts || [];
        return accounts.filter(acc => acc.bankAccountNumber).map(acc => ({ provider: "xero", name: acc.name, accountNumber: acc.bankAccountNumber, currency: acc.currencyCode }));
    }
    catch (error) {
        logger_1.logger.error({ message: "Failed to fetch Xero bank accounts", context: "xero_bank_sync", original_error: String(error) });
        return [];
    }
}
async function revokeXeroIntegration(organizationId) {
    const integration = await getXeroIntegration(organizationId);
    if (!integration)
        return;
    try {
        const xero = createXeroClient();
        await xero.initialize();
        xero.setTokenSet(storedTokenSet(integration));
        if (tokenNeedsRefresh(integration.expires_at))
            await xero.refreshToken();
        await xero.revokeToken();
    }
    catch (error) {
        logger_1.logger.external({ service: "Xero", action: "revoke_token", success: false, organization_id: organizationId, error: error instanceof Error ? error.message : "Unknown error" });
    }
}
