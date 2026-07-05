/* eslint-disable */
import "server-only";

import crypto from "crypto";
import { XeroClient } from "xero-node";
import type { Invoice, TokenSet } from "xero-node";

import { getRequiredEnv } from "@/lib/env";
import { getAppUrl } from "@/lib/email/reminder";
import { logger } from "@/lib/logger";
import { computeFirstReminderSendAt } from "@/lib/reminder-schedule";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const XERO_PROVIDER = "xero";
import { inngest } from "@/lib/inngest/client";
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

type XeroStatePayload = {
  createdAt: number;
  nonce: string;
  userId: string;
};

export type XeroIntegrationRow = {
  organization_id: string;
  provider: "xero";
  access_token: string;
  refresh_token: string;
  expires_at: string;
  tenant_id: string;
  last_synced_at: string | null;
  bank_account_id?: string | null;
  bank_account_name?: string | null;
};

export type XeroSyncResult = {
  imported: number;
  markedPaid: number;
  skipped: number;
  totalInvoices: number;
  updated: number;
};

type ExistingInvoiceRow = {
  id: string;
  client_id: string;
  xero_id: string;
  amount: number;
  status: string;
  updated_at: string;
};

function getXeroClientId() { return getRequiredEnv("XERO_CLIENT_ID"); }
function getXeroClientSecret() { return getRequiredEnv("XERO_CLIENT_SECRET"); }
function getXeroStateSecret() { return process.env.XERO_STATE_SECRET ?? getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"); }

export function getXeroCallbackUrl() {
  return `${getAppUrl()}/api/integrations/xero/callback`;
}

function createXeroClient(state?: string) {
  return new XeroClient({
    clientId: getXeroClientId(),
    clientSecret: getXeroClientSecret(),
    redirectUris: [getXeroCallbackUrl()],
    scopes: XERO_SCOPES,
    state,
  });
}

function signStatePayload(encodedPayload: string) {
  return crypto.createHmac("sha256", getXeroStateSecret()).update(encodedPayload).digest("base64url");
}

export function createXeroState(userId: string) {
  const payload: XeroStatePayload = { createdAt: Date.now(), nonce: crypto.randomUUID(), userId };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signStatePayload(encodedPayload)}`;
}

function verifyXeroState(state: string): XeroStatePayload {
  const [encodedPayload, signature] = state.split(".");
  if (!encodedPayload || !signature) throw new Error("Invalid Xero OAuth state.");
  const expected = signStatePayload(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error("Invalid Xero OAuth state signature.");
  }
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as XeroStatePayload;
  if (!payload.userId || Date.now() - payload.createdAt > STATE_MAX_AGE_MS) throw new Error("Expired Xero OAuth state.");
  return payload;
}

export async function buildXeroConsentUrl(userId: string) {
  const state = createXeroState(userId);
  return createXeroClient(state).buildConsentUrl();
}

function getTokenExpiresAt(tokenSet: TokenSet) {
  const token = tokenSet as TokenSet & { expires_at?: number; expires_in?: number };
  if (token.expires_at) return new Date(token.expires_at * 1000).toISOString();
  const expiresInSeconds = token.expires_in ?? 1800;
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
}

function requireTokenValues(tokenSet: TokenSet) {
  if (!tokenSet.access_token || !tokenSet.refresh_token) throw new Error("Xero did not return a complete OAuth token set.");
  return { accessToken: tokenSet.access_token, expiresAt: getTokenExpiresAt(tokenSet), refreshToken: tokenSet.refresh_token };
}

function storedTokenSet(integration: XeroIntegrationRow) {
  return { access_token: integration.access_token, expires_at: Math.floor(new Date(integration.expires_at).getTime() / 1000), refresh_token: integration.refresh_token };
}

function tokenNeedsRefresh(expiresAt: string) {
  return new Date(expiresAt).getTime() - Date.now() <= TOKEN_REFRESH_SKEW_MS;
}

export async function getValidXeroClient(integration: XeroIntegrationRow) {
  if (!tokenNeedsRefresh(integration.expires_at)) {
    const xero = new XeroClient();
    xero.setTokenSet(storedTokenSet(integration));
    return { integration, xero };
  }
  const xero = new XeroClient();
  const refreshedTokenSet = await xero.refreshWithRefreshToken(getXeroClientId(), getXeroClientSecret(), integration.refresh_token);
  const tokenValues = requireTokenValues(refreshedTokenSet);
  const updatedIntegration: XeroIntegrationRow = { ...integration, access_token: tokenValues.accessToken, expires_at: tokenValues.expiresAt, refresh_token: tokenValues.refreshToken };
  
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("integrations").update({ access_token: updatedIntegration.access_token, expires_at: updatedIntegration.expires_at, refresh_token: updatedIntegration.refresh_token })
    .eq("organization_id", integration.organization_id).eq("provider", XERO_PROVIDER);
  
  if (error) throw new Error(error.message);
  return { integration: updatedIntegration, xero };
}

export async function completeXeroOAuthCallback(callbackUrl: string, state: string) {
  const statePayload = verifyXeroState(state);
  const xero = createXeroClient(state);
  const tokenSet = await xero.apiCallback(callbackUrl);
  const tokenValues = requireTokenValues(tokenSet);
  const tenants = await xero.updateTenants(false);
  if (tenants.length === 0) throw new Error("No Xero organisation was connected.");

  const isMultiTenant = tenants.length > 1;
  const tenantId = isMultiTenant ? "PENDING_SELECTION" : tenants[0].tenantId as string;

  // For connecting, the auth.userId is actually passed in statePayload.userId. We should map it to organization_id.
  const supabase = createSupabaseAdminClient();
  
  // Find org id
  const { data: member } = await supabase.from("organization_members").select("organization_id").eq("user_id", statePayload.userId).single();
  if (!member) throw new Error("User has no organization");

  const { error } = await supabase.from("integrations").upsert(
    { organization_id: member.organization_id, provider: XERO_PROVIDER, access_token: tokenValues.accessToken, refresh_token: tokenValues.refreshToken, expires_at: tokenValues.expiresAt, tenant_id: tenantId },
    { onConflict: "organization_id,provider" },
  );

  if (error) throw new Error(error.message);
  
  if (isMultiTenant) {
    return { imported: 0, updated: 0, markedPaid: 0, requiresTenantSelection: true };
  }
  
  await inngest.send({
    name: "xero/integration.connected",
    data: { organization_id: member.organization_id },
  });
  
  return { imported: 0, updated: 0, markedPaid: 0, requiresTenantSelection: false };
}

export async function getAvailableXeroTenants(organizationId: string) {
  const integration = await getXeroIntegration(organizationId);
  if (!integration) throw new Error("Xero is not connected.");

  const { xero } = await getValidXeroClient(integration);
  const tenants = await xero.updateTenants(false);
  return tenants;
}

export function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || null;
}

export function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export function getWorkflowStatus(invoice: Invoice) {
  const amountDue = Number(invoice.amountDue ?? 0);
  const amountPaid = Number(invoice.amountPaid ?? 0);
  const dueDate = toIsoDate(invoice.dueDate);
  if (String(invoice.status) === "PAID" || amountDue <= 0) return "paid";
  if (amountPaid > 0) return "partial";
  if (dueDate && dueDate < new Date().toISOString().slice(0, 10)) return "overdue";
  return "outstanding";
}

export function getInvoiceTotal(invoice: Invoice) {
  const total = Number(invoice.total ?? 0);
  if (total > 0) return Math.round(total * 100) / 100;
  const amountDue = Number(invoice.amountDue ?? 0);
  const amountPaid = Number(invoice.amountPaid ?? 0);
  return Math.round((amountDue + amountPaid) * 100) / 100;
}

export async function getXeroIntegration(organizationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("integrations").select("*").eq("organization_id", organizationId).eq("provider", XERO_PROVIDER).maybeSingle<XeroIntegrationRow>();
  if (error) throw new Error(error.message);
  return data;
}

export async function getXeroIntegrationByTenant(tenantId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("integrations").select("*").eq("tenant_id", tenantId).eq("provider", XERO_PROVIDER).maybeSingle<XeroIntegrationRow>();
  if (error) throw new Error(error.message);
  return data;
}

async function fetchAllXeroInvoices(xero: XeroClient, tenantId: string) {
  const invoices: Invoice[] = [];
  let page = 1;
  while (true) {
    const response = await xero.accountingApi.getInvoices(tenantId, undefined, 'Type=="ACCREC"', "UpdatedDateUTC DESC", undefined, undefined, undefined, undefined, page, false, undefined, undefined, false, 100);
    invoices.push(...(response.body.invoices ?? []));
    if ((response.body.invoices?.length || 0) < 100) break;
    page += 1;
  }
  return invoices;
}

async function fetchAllXeroPayments(xero: XeroClient, tenantId: string) {
  const payments: any[] = [];
  let page = 1;
  while (true) {
    const response = await xero.accountingApi.getPayments(tenantId, undefined, 'Status=="AUTHORISED"', "UpdatedDateUTC DESC", page);
    payments.push(...(response.body.payments ?? []));
    if ((response.body.payments?.length || 0) < 100) break;
    page += 1;
  }
  return payments;
}

export async function fetchXeroInvoice(xero: XeroClient, tenantId: string, invoiceId: string) {
  const response = await xero.accountingApi.getInvoice(tenantId, invoiceId);
  return response.body.invoices?.[0];
}

export async function fetchXeroPayment(xero: XeroClient, tenantId: string, paymentId: string) {
  const response = await xero.accountingApi.getPayment(tenantId, paymentId);
  return response.body.payments?.[0];
}

async function loadExistingXeroInvoices(organizationId: string, invoiceIds: string[]) {
  if (invoiceIds.length === 0) return new Map<string, ExistingInvoiceRow>();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("invoices").select("id, client_id, xero_id, amount, status, updated_at").eq("organization_id", organizationId).in("xero_id", invoiceIds);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row) => [row.xero_id ?? "", row as ExistingInvoiceRow]));
}

export async function syncXeroInvoicesForOrg(organizationId: string): Promise<XeroSyncResult> {
  const integration = await getXeroIntegration(organizationId);
  if (!integration) throw new Error("Xero is not connected.");
  if (integration.tenant_id === "PENDING_SELECTION") throw new Error("Please select a Xero tenant first.");

  const { xero } = await getValidXeroClient(integration);
  const invoices = await fetchAllXeroInvoices(xero, integration.tenant_id);
  const invoiceIds = invoices.map((invoice) => invoice.invoiceID).filter((invoiceId): invoiceId is string => Boolean(invoiceId));
  const existingByInvoiceId = await loadExistingXeroInvoices(organizationId, invoiceIds);
  const supabase = createSupabaseAdminClient();
  
  const { data: clientsData } = await supabase.from("clients").select("id, name, email").eq("organization_id", organizationId);
  const clientsMap = new Map<string, { id: string }>();
  for (const client of clientsData || []) {
    if (client.email) clientsMap.set(client.email.toLowerCase(), client);
    if (client.name) clientsMap.set(client.name.toLowerCase(), client);
  }

  const result: XeroSyncResult = { imported: 0, markedPaid: 0, skipped: 0, totalInvoices: invoices.length, updated: 0 };

  for (const invoice of invoices) {
    const invoiceId = invoice.invoiceID;
    if (!invoiceId) { result.skipped += 1; continue; }

    const contactName = invoice.contact?.name?.trim() || "Xero customer";
    const email = normalizeEmail(invoice.contact?.emailAddress) || "";
    const amountOwed = getInvoiceTotal(invoice);
    if (amountOwed <= 0) { result.skipped += 1; continue; }

    let clientRecord = email ? clientsMap.get(email.toLowerCase()) : undefined;
    if (!clientRecord) clientRecord = clientsMap.get(contactName.toLowerCase());

    if (!clientRecord) {
      const { data: client, error: clientError } = await supabase.from("clients").insert({ organization_id: organizationId, name: contactName, email: email }).select("id").single();
      if (clientError) throw new Error(clientError.message);
      clientRecord = { id: client.id };
      if (email) clientsMap.set(email.toLowerCase(), clientRecord);
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
      if (error) throw new Error(error.message);
      
      if (status === "paid" && existing.status !== "paid") result.markedPaid += 1;
      else result.updated += 1;
      continue;
    }

    const { data: newInvoice, error } = await supabase.from("invoices").insert(payload).select("id").single();
    if (error) throw new Error(error.message);

    result.imported += 1;
  }

  // Fetch and insert actual payments
  const xeroPayments = await fetchAllXeroPayments(xero, integration.tenant_id);
  const paymentIds = xeroPayments.map(p => p.paymentID).filter(Boolean);
  
  if (paymentIds.length > 0) {
    const { data: existingPayments } = await supabase
      .from("payments")
      .select("reference_id")
      .eq("organization_id", organizationId)
      .in("reference_id", paymentIds);
      
    const existingPaymentIds = new Set(existingPayments?.map(p => p.reference_id) || []);
    
    // We need to map xero_invoice_id to duely invoice_id
    const { data: allInvoices } = await supabase
      .from("invoices")
      .select("id, xero_id")
      .eq("organization_id", organizationId);
      
    const xeroIdToDuelyId = new Map(allInvoices?.map(inv => [inv.xero_id, inv.id]) || []);
    const newPayments = [];
    
    for (const p of xeroPayments) {
      if (existingPaymentIds.has(p.paymentID)) continue;
      
      const duelyInvoiceId = xeroIdToDuelyId.get(p.invoice?.invoiceID);
      if (!duelyInvoiceId) continue; // Payment for an invoice we don't have
      
      if (!p.amount || p.amount <= 0) continue;
      
      newPayments.push({
        organization_id: organizationId,
        invoice_id: duelyInvoiceId,
        amount: p.amount,
        currency: p.invoice?.currencyCode || "USD",
        payment_date: toIsoDate(p.date) || new Date().toISOString().substring(0, 10),
        payment_method: "xero_sync",
        reference_id: p.paymentID
      });
    }
    
    if (newPayments.length > 0) {
      const { error: logsError } = await supabase.from("payments").insert(newPayments);
      if (logsError) {
        logger.error({ message: "Failed to insert exact payments from Xero", context: "syncXeroInvoicesForOrg", error: logsError.message, organization_id: organizationId });
      }
    }
  }

  const { error: syncError } = await supabase.from("integrations").update({ last_synced_at: new Date().toISOString() }).eq("organization_id", organizationId).eq("provider", XERO_PROVIDER);
  if (syncError) throw new Error(syncError.message);

  logger.external({ service: "Xero", action: "sync_invoices", success: true, organization_id: organizationId });
  return result;
}

export async function getXeroBankAccounts(organizationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: integration } = await supabase.from("integrations").select("*").eq("organization_id", organizationId).eq("provider", "xero").maybeSingle<XeroIntegrationRow>();
  if (!integration || !integration.tenant_id) return [];
  try {
    const { xero } = await getValidXeroClient(integration);
    const response = await xero.accountingApi.getAccounts(integration.tenant_id, undefined, 'Type=="BANK"');
    const accounts = response.body.accounts || [];
    return accounts.filter(acc => acc.bankAccountNumber).map(acc => ({ provider: "xero", name: acc.name, accountNumber: acc.bankAccountNumber, currency: acc.currencyCode }));
  } catch (error) {
    logger.error({ message: "Failed to fetch Xero bank accounts", context: "xero_bank_sync", original_error: String(error) });
    return [];
  }
}

export async function revokeXeroIntegration(organizationId: string) {
  const integration = await getXeroIntegration(organizationId);
  if (!integration) return;
  try {
    const xero = createXeroClient();
    await xero.initialize();
    xero.setTokenSet(storedTokenSet(integration));
    if (tokenNeedsRefresh(integration.expires_at)) await xero.refreshToken();
    await xero.revokeToken();
  } catch (error) {
    logger.external({ service: "Xero", action: "revoke_token", success: false, organization_id: organizationId, error: error instanceof Error ? error.message : "Unknown error" });
  }
}
