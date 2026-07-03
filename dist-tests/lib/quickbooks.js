"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuickBooksCallbackUrl = getQuickBooksCallbackUrl;
exports.createQuickBooksState = createQuickBooksState;
exports.buildQuickBooksConsentUrl = buildQuickBooksConsentUrl;
exports.completeQuickBooksOAuthCallback = completeQuickBooksOAuthCallback;
exports.syncQuickBooksInvoicesForOrg = syncQuickBooksInvoicesForOrg;
exports.revokeQuickBooksIntegration = revokeQuickBooksIntegration;
exports.getQuickBooksBankAccounts = getQuickBooksBankAccounts;
/* eslint-disable */
require("server-only");
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("@/lib/env");
const reminder_1 = require("@/lib/email/reminder");
const logger_1 = require("@/lib/logger");
const admin_1 = require("@/lib/supabase/admin");
const QUICKBOOKS_PROVIDER = "quickbooks";
const QUICKBOOKS_SCOPES = ["com.intuit.quickbooks.accounting"];
const STATE_MAX_AGE_MS = 10 * 60 * 1000;
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;
function getQuickBooksClientId() {
    return (0, env_1.getRequiredEnv)("QUICKBOOKS_CLIENT_ID");
}
function getQuickBooksClientSecret() {
    return (0, env_1.getRequiredEnv)("QUICKBOOKS_CLIENT_SECRET");
}
function getQuickBooksStateSecret() {
    return process.env.QUICKBOOKS_STATE_SECRET ?? (0, env_1.getRequiredEnv)("SUPABASE_SERVICE_ROLE_KEY");
}
function isSandbox() {
    return process.env.QUICKBOOKS_ENVIRONMENT === "sandbox" || getQuickBooksClientId().startsWith("AB") === false;
}
function getApiBaseUrl() {
    return isSandbox()
        ? "https://sandbox-quickbooks.api.intuit.com"
        : "https://quickbooks.api.intuit.com";
}
function getQuickBooksCallbackUrl() {
    return `${(0, reminder_1.getAppUrl)()}/api/integrations/quickbooks/callback`;
}
function signStatePayload(encodedPayload) {
    return crypto_1.default
        .createHmac("sha256", getQuickBooksStateSecret())
        .update(encodedPayload)
        .digest("base64url");
}
function createQuickBooksState(userId) {
    const payload = {
        createdAt: Date.now(),
        nonce: crypto_1.default.randomUUID(),
        userId,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encodedPayload}.${signStatePayload(encodedPayload)}`;
}
function verifyQuickBooksState(state) {
    const [encodedPayload, signature] = state.split(".");
    if (!encodedPayload || !signature) {
        throw new Error("Invalid QuickBooks OAuth state.");
    }
    const expected = signStatePayload(encodedPayload);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length ||
        !crypto_1.default.timingSafeEqual(actualBuffer, expectedBuffer)) {
        throw new Error("Invalid QuickBooks OAuth state signature.");
    }
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!payload.userId || Date.now() - payload.createdAt > STATE_MAX_AGE_MS) {
        throw new Error("Expired QuickBooks OAuth state.");
    }
    return payload;
}
async function buildQuickBooksConsentUrl(userId) {
    const state = createQuickBooksState(userId);
    const url = new URL("https://appcenter.intuit.com/connect/oauth2");
    url.searchParams.set("client_id", getQuickBooksClientId());
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", QUICKBOOKS_SCOPES.join(" "));
    url.searchParams.set("redirect_uri", getQuickBooksCallbackUrl());
    url.searchParams.set("state", state);
    return url.toString();
}
async function fetchTokens(params) {
    const authHeader = Buffer.from(`${getQuickBooksClientId()}:${getQuickBooksClientSecret()}`).toString("base64");
    const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${authHeader}`,
        },
        body: params.toString(),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch QuickBooks tokens: ${text}`);
    }
    return response.json();
}
function tokenNeedsRefresh(expiresAt) {
    return new Date(expiresAt).getTime() - Date.now() <= TOKEN_REFRESH_SKEW_MS;
}
async function getValidQuickBooksTokens(integration) {
    if (!tokenNeedsRefresh(integration.expires_at)) {
        return integration;
    }
    const params = new URLSearchParams();
    params.set("grant_type", "refresh_token");
    params.set("refresh_token", integration.refresh_token);
    const tokenData = await fetchTokens(params);
    const updatedIntegration = {
        ...integration,
        access_token: tokenData.access_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        refresh_token: tokenData.refresh_token || integration.refresh_token,
    };
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    const { error } = await supabase
        .from("integrations")
        .update({
        access_token: updatedIntegration.access_token,
        expires_at: updatedIntegration.expires_at,
        refresh_token: updatedIntegration.refresh_token,
    })
        .eq("organization_id", integration.organization_id)
        .eq("provider", QUICKBOOKS_PROVIDER);
    if (error) {
        throw new Error(error.message);
    }
    return updatedIntegration;
}
async function completeQuickBooksOAuthCallback(code, realmId, state) {
    const statePayload = verifyQuickBooksState(state);
    const params = new URLSearchParams();
    params.set("grant_type", "authorization_code");
    params.set("code", code);
    params.set("redirect_uri", getQuickBooksCallbackUrl());
    const tokenData = await fetchTokens(params);
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    // Find org id
    const { data: member } = await supabase.from("organization_members").select("organization_id").eq("user_id", statePayload.userId).single();
    if (!member)
        throw new Error("User has no organization");
    const { error } = await supabase.from("integrations").upsert({
        organization_id: member.organization_id,
        provider: QUICKBOOKS_PROVIDER,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        realm_id: realmId,
    }, { onConflict: "organization_id,provider" });
    if (error) {
        throw new Error(error.message);
    }
    return syncQuickBooksInvoicesForOrg(member.organization_id);
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
async function getQuickBooksIntegration(organizationId) {
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("provider", QUICKBOOKS_PROVIDER)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    return data;
}
async function fetchAllQuickBooksInvoices(accessToken, realmId) {
    const invoices = [];
    let startPosition = 1;
    const maxResults = 1000;
    while (true) {
        const query = `select * from Invoice STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;
        const url = new URL(`${getApiBaseUrl()}/v3/company/${realmId}/query`);
        url.searchParams.set("query", query);
        url.searchParams.set("minorversion", "65");
        const response = await fetch(url.toString(), {
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to fetch QuickBooks invoices: ${text}`);
        }
        const data = await response.json();
        const batch = data.QueryResponse?.Invoice || [];
        invoices.push(...batch);
        if (batch.length < maxResults) {
            break;
        }
        startPosition += maxResults;
    }
    return invoices;
}
async function fetchQuickBooksCustomers(accessToken, realmId, customerIds) {
    if (customerIds.length === 0)
        return new Map();
    const query = `select * from Customer where Id in (${customerIds.map(id => `'${id}'`).join(",")})`;
    const url = new URL(`${getApiBaseUrl()}/v3/company/${realmId}/query`);
    url.searchParams.set("query", query);
    url.searchParams.set("minorversion", "65");
    const response = await fetch(url.toString(), {
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        return new Map();
    }
    const data = await response.json();
    const customers = data.QueryResponse?.Customer || [];
    return new Map(customers.map((c) => [c.Id, c]));
}
async function loadExistingQuickBooksInvoices(organizationId, invoiceIds) {
    if (invoiceIds.length === 0)
        return new Map();
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    const { data, error } = await supabase
        .from("invoices")
        .select("id, client_id, quickbooks_id, amount, status, updated_at")
        .eq("organization_id", organizationId)
        .in("quickbooks_id", invoiceIds);
    if (error) {
        throw new Error(error.message);
    }
    return new Map((data ?? []).map((row) => [row.quickbooks_id ?? "", row]));
}
async function syncQuickBooksInvoicesForOrg(organizationId) {
    const integration = await getQuickBooksIntegration(organizationId);
    if (!integration || !integration.realm_id) {
        throw new Error("QuickBooks is not connected.");
    }
    const validIntegration = await getValidQuickBooksTokens(integration);
    const invoices = await fetchAllQuickBooksInvoices(validIntegration.access_token, integration.realm_id);
    const customerIds = [...new Set(invoices.map((inv) => inv.CustomerRef?.value).filter(Boolean))];
    const qbCustomers = await fetchQuickBooksCustomers(validIntegration.access_token, integration.realm_id, customerIds);
    const invoiceIds = invoices.map((invoice) => invoice.Id).filter(Boolean);
    const existingByInvoiceId = await loadExistingQuickBooksInvoices(organizationId, invoiceIds);
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    const { data: clientsData } = await supabase.from("clients").select("id, name, email").eq("organization_id", organizationId);
    const clientsMap = new Map();
    for (const client of clientsData || []) {
        if (client.email)
            clientsMap.set(client.email.toLowerCase(), client);
        if (client.name)
            clientsMap.set(client.name.toLowerCase(), client);
    }
    const result = {
        imported: 0,
        markedPaid: 0,
        skipped: 0,
        totalInvoices: invoices.length,
        updated: 0,
    };
    const newPayments = [];
    for (const invoice of invoices) {
        const invoiceId = invoice.Id;
        if (!invoiceId) {
            result.skipped += 1;
            continue;
        }
        const qbCustomer = qbCustomers.get(invoice.CustomerRef?.value);
        const contactName = qbCustomer?.DisplayName || invoice.CustomerRef?.name?.trim() || "QuickBooks customer";
        const email = normalizeEmail(invoice.BillEmail?.Address || qbCustomer?.PrimaryEmailAddr?.Address) || "";
        const totalAmount = Number(invoice.TotalAmt ?? 0);
        const amountPaid = totalAmount - Number(invoice.Balance ?? invoice.TotalAmt ?? 0);
        const isPaid = totalAmount > 0 && Number(invoice.Balance ?? totalAmount) <= 0;
        let status = "outstanding";
        if (isPaid)
            status = "paid";
        else if (amountPaid > 0 && amountPaid < totalAmount)
            status = "partial";
        else if (invoice.DueDate && new Date(invoice.DueDate) < new Date())
            status = "overdue";
        const paymentDateStr = invoice.MetaData?.LastUpdatedTime || new Date().toISOString();
        const paymentDate = new Date(paymentDateStr).toISOString().slice(0, 10);
        const qbUpdatedDate = invoice.MetaData?.LastUpdatedTime ? new Date(invoice.MetaData.LastUpdatedTime) : new Date(0);
        if (totalAmount <= 0) {
            result.skipped += 1;
            continue;
        }
        let clientRecord = email ? clientsMap.get(email.toLowerCase()) : undefined;
        if (!clientRecord)
            clientRecord = clientsMap.get(contactName.toLowerCase());
        if (!clientRecord) {
            const { data: client, error: clientError } = await supabase
                .from("clients")
                .insert({
                organization_id: organizationId,
                name: contactName,
                email: email
            })
                .select("id")
                .single();
            if (clientError)
                throw new Error(clientError.message);
            clientRecord = { id: client.id };
            if (email)
                clientsMap.set(email.toLowerCase(), clientRecord);
            clientsMap.set(contactName.toLowerCase(), clientRecord);
        }
        const payload = {
            organization_id: organizationId,
            client_id: clientRecord.id,
            amount: totalAmount,
            currency: String(invoice.CurrencyRef?.value ?? "USD"),
            due_date: toIsoDate(invoice.DueDate),
            status: status,
            quickbooks_id: invoiceId,
            updated_at: new Date().toISOString()
        };
        const existing = existingByInvoiceId.get(invoiceId);
        if (existing) {
            const duelyUpdatedDate = new Date(existing.updated_at || 0);
            // Dual Sync Truth check: if Duely has more recent updates, DO NOT overwrite it from QuickBooks.
            if (duelyUpdatedDate > qbUpdatedDate) {
                result.skipped += 1;
                continue;
            }
            const { error } = await supabase
                .from("invoices")
                .update(payload)
                .eq("id", existing.id);
            if (error) {
                throw new Error(error.message);
            }
            if (status === "paid" && existing.status !== "paid")
                result.markedPaid += 1;
            else
                result.updated += 1;
            if (amountPaid > 0 && status === "paid" && existing.status !== "paid") {
                newPayments.push({
                    organization_id: organizationId,
                    invoice_id: existing.id,
                    amount: amountPaid,
                    currency: payload.currency,
                    payment_date: paymentDate,
                    payment_method: "quickbooks_sync"
                });
            }
            continue;
        }
        const { data: newInvoice, error } = await supabase.from("invoices").insert(payload).select("id").single();
        if (error)
            throw new Error(error.message);
        if (amountPaid > 0 || status === "paid") {
            newPayments.push({
                organization_id: organizationId,
                invoice_id: newInvoice.id,
                amount: amountPaid > 0 ? amountPaid : totalAmount,
                currency: payload.currency,
                payment_date: paymentDate,
                payment_method: "quickbooks_sync"
            });
        }
        result.imported += 1;
    }
    if (newPayments.length > 0) {
        const { error: logsError } = await supabase.from("payments").insert(newPayments);
        if (logsError) {
            logger_1.logger.error({ message: "Failed to insert payments from QuickBooks sync", context: "syncQuickBooksInvoicesForOrg", error: logsError.message, organization_id: organizationId });
        }
    }
    const { error: syncError } = await supabase
        .from("integrations")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("organization_id", organizationId)
        .eq("provider", QUICKBOOKS_PROVIDER);
    if (syncError) {
        throw new Error(syncError.message);
    }
    logger_1.logger.external({
        service: "QuickBooks",
        action: "sync_invoices",
        success: true,
        organization_id: organizationId,
    });
    return result;
}
async function revokeQuickBooksIntegration(organizationId) {
    const integration = await getQuickBooksIntegration(organizationId);
    if (!integration)
        return;
    try {
        const authHeader = Buffer.from(`${getQuickBooksClientId()}:${getQuickBooksClientSecret()}`).toString("base64");
        await fetch("https://developer.intuit.com/v2/oauth2/tokens/revoke", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Basic ${authHeader}`,
            },
            body: JSON.stringify({ token: integration.refresh_token }),
        });
    }
    catch (error) {
        logger_1.logger.external({
            service: "QuickBooks",
            action: "revoke_token",
            success: false,
            organization_id: organizationId,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
async function getQuickBooksBankAccounts(organizationId) {
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    const { data: integration } = await supabase
        .from("integrations")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("provider", "quickbooks")
        .maybeSingle();
    if (!integration || !integration.realm_id)
        return [];
    try {
        const validIntegration = await getValidQuickBooksTokens(integration);
        const query = `select * from Account where AccountType = 'Bank'`;
        const url = new URL(`${getApiBaseUrl()}/v3/company/${integration.realm_id}/query`);
        url.searchParams.set("query", query);
        url.searchParams.set("minorversion", "65");
        const response = await fetch(url.toString(), {
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${validIntegration.access_token}`,
            },
        });
        if (!response.ok)
            return [];
        const data = await response.json();
        const accounts = data.QueryResponse?.Account || [];
        return accounts.map((acc) => ({
            provider: "quickbooks",
            name: acc.Name,
            accountNumber: acc.AcctNum || acc.Id,
            currency: acc.CurrencyRef?.value
        }));
    }
    catch (error) {
        logger_1.logger.error({ message: "Failed to fetch QuickBooks bank accounts", context: "quickbooks_bank_sync", original_error: String(error) });
        return [];
    }
}
