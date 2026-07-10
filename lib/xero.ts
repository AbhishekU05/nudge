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
  "accounting.contacts.read",
  "accounting.invoices.read",
  "accounting.payments",
  "accounting.settings.read",
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
  xero_default_account_id?: string | null;
  xero_default_account_name?: string | null;
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

export async function forceRefreshXeroToken(integration: XeroIntegrationRow) {
  const xero = new XeroClient();
  try {
    const refreshedTokenSet = await xero.refreshWithRefreshToken(getXeroClientId(), getXeroClientSecret(), integration.refresh_token);
    const tokenValues = requireTokenValues(refreshedTokenSet);
    const updatedIntegration: XeroIntegrationRow = { ...integration, access_token: tokenValues.accessToken, expires_at: tokenValues.expiresAt, refresh_token: tokenValues.refreshToken };
    
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("integrations").update({ access_token: updatedIntegration.access_token, expires_at: updatedIntegration.expires_at, refresh_token: updatedIntegration.refresh_token })
      .eq("organization_id", integration.organization_id).eq("provider", XERO_PROVIDER);
    
    if (error) throw new Error(error.message);
    return { integration: updatedIntegration, xero };
  } catch (error: any) {
    logger.error({ message: "Failed to force refresh Xero token", context: "xero_token_refresh", original_error: error.message, organization_id: integration.organization_id });
    throw error;
  }
}

export async function getValidXeroClient(integration: XeroIntegrationRow) {
  if (!tokenNeedsRefresh(integration.expires_at)) {
    const xero = new XeroClient();
    xero.setTokenSet(storedTokenSet(integration));
    return { integration, xero };
  }
  return forceRefreshXeroToken(integration);
}

export async function withXeroRetry<T>(
  integration: XeroIntegrationRow,
  operation: (xero: XeroClient, currentIntegration: XeroIntegrationRow) => Promise<T>
): Promise<{ result: T; integration: XeroIntegrationRow }> {
  let { xero, integration: currentIntegration } = await getValidXeroClient(integration);
  
  try {
    const result = await operation(xero, currentIntegration);
    return { result, integration: currentIntegration };
  } catch (error: any) {
    if (error?.response?.statusCode === 401) {
      logger.external({ service: "Xero", action: "token_refresh_retry", success: false, organization_id: currentIntegration.organization_id, error: "401 Unauthorized" });
      const refreshed = await forceRefreshXeroToken(currentIntegration);
      currentIntegration = refreshed.integration;
      xero = refreshed.xero;
      
      const retryResult = await operation(xero, currentIntegration);
      return { result: retryResult, integration: currentIntegration };
    }
    throw error;
  }
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





export async function fetchXeroInvoice(xero: XeroClient, tenantId: string, invoiceId: string) {
  // Deliberately does NOT also fetch getOnlineInvoice (the hosted payment
  // link) here — that's a separate Xero API call this function used to make
  // on every single webhook-triggered sync, whether or not anyone was about
  // to look at the link. The client portal (app/portal/[token]/page.tsx)
  // already fetches and caches it lazily, only when a client actually opens
  // the portal for an invoice that doesn't have one yet.
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


export async function syncXeroDataPageForOrg(
  organizationId: string, 
  syncType: "invoices" | "payments", 
  page: number
): Promise<{ hasMore: boolean; imported: number; updated: number; nextType?: "invoices" | "payments"; nextPage: number }> {
  const integration = await getXeroIntegration(organizationId);
  if (!integration) throw new Error("Xero is not connected.");
  if (integration.tenant_id === "PENDING_SELECTION") throw new Error("Please select a Xero tenant first.");

  let currentIntegration = integration;
  let xero: XeroClient;

  const supabase = createSupabaseAdminClient();
  const result = { hasMore: false, imported: 0, updated: 0, nextType: syncType, nextPage: page + 1 };

  if (syncType === "invoices") {
    const { result: response, integration: updatedInt } = await withXeroRetry(currentIntegration, async (client, intg) => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const year = twoYearsAgo.getFullYear();
      const month = String(twoYearsAgo.getMonth() + 1).padStart(2, '0');
      const day = String(twoYearsAgo.getDate()).padStart(2, '0');
      const whereClause = `Type=="ACCREC" AND (Status!="PAID" OR (Status=="PAID" AND Date >= DateTime(${year}, ${month}, ${day})))`;

      return client.accountingApi.getInvoices(intg.tenant_id, undefined, whereClause, "UpdatedDateUTC DESC", undefined, undefined, undefined, ["AUTHORISED", "PAID", "DRAFT", "SUBMITTED"], page, false, undefined, undefined, false, 100);
    });
    currentIntegration = updatedInt;
    
    const invoices = response.body.invoices ?? [];
    result.hasMore = invoices.length >= 100;
    
    if (!result.hasMore) {
      result.nextType = "payments";
      result.nextPage = 1;
    }

    if (invoices.length === 0) {
      return result;
    }

    const invoiceIds = invoices.map((i) => i.invoiceID).filter(Boolean) as string[];
    const existingByInvoiceId = await loadExistingXeroInvoices(organizationId, invoiceIds);
    
    const { data: clientsData } = await supabase.from("clients").select("id, name, email").eq("organization_id", organizationId);
    const clientsMap = new Map<string, { id: string }>();
    
    for (const client of clientsData || []) {
      if (client.email) clientsMap.set(client.email.toLowerCase(), client);
      if (client.name) clientsMap.set(client.name.toLowerCase(), client);
    }

    for (const invoice of invoices) {
      const invoiceId = invoice.invoiceID;
      if (!invoiceId) continue;
      
      const contactName = invoice.contact?.name?.trim() || "Xero customer";
      const email = normalizeEmail(invoice.contact?.emailAddress) || "";
      const amountOwed = getInvoiceTotal(invoice);
      if (amountOwed <= 0) continue;

      let clientRecord = email ? clientsMap.get(email.toLowerCase()) : undefined;
      if (!clientRecord) clientRecord = clientsMap.get(contactName.toLowerCase());

      if (!clientRecord) {
        const { data: client, error: clientError } = await supabase.from("clients").insert({ organization_id: organizationId, name: contactName, email }).select("id").single();
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
        invoice_number: invoice.invoiceNumber || null,
        reference: invoice.reference || null,
        updated_at: new Date().toISOString(),
        reminders_enabled: false
      };

      if (existing) {
        const duelyUpdatedDate = new Date(existing.updated_at || 0);
        if (duelyUpdatedDate > xeroUpdatedDate) continue;
        await supabase.from("invoices").update(payload).eq("id", existing.id);
        result.updated += 1;
      } else {
        await supabase.from("invoices").insert(payload);
        result.imported += 1;
      }
    }
    
    return result;
  } 
  
  if (syncType === "payments") {
    const { result: response, integration: updatedInt } = await withXeroRetry(currentIntegration, async (client, intg) => {
      return client.accountingApi.getPayments(intg.tenant_id, undefined, 'Status=="AUTHORISED"', "UpdatedDateUTC DESC", page);
    });
    currentIntegration = updatedInt;

    const payments = response.body.payments ?? [];
    result.hasMore = payments.length >= 100;
    
    if (payments.length === 0) {
      await supabase.from("integrations").update({ last_synced_at: new Date().toISOString() }).eq("organization_id", organizationId).eq("provider", XERO_PROVIDER);
      return result;
    }

    const paymentIds = payments.map(p => p.paymentID).filter(Boolean);
    const { data: existingPayments } = await supabase.from("payments").select("reference_id").eq("organization_id", organizationId).in("reference_id", paymentIds as string[]);
    const existingPaymentIds = new Set(existingPayments?.map(p => p.reference_id) || []);
      
    const { data: allInvoices } = await supabase.from("invoices").select("id, xero_id").eq("organization_id", organizationId);
    const xeroIdToDuelyId = new Map(allInvoices?.map(inv => [inv.xero_id, inv.id]) || []);
    
    const newPayments = [];

    for (const p of payments) {
      if (!p.paymentID || !p.invoice?.invoiceID) continue;
      
      const referenceId = p.paymentID;
      const invoiceId = xeroIdToDuelyId.get(p.invoice.invoiceID);
      
      if (!invoiceId) continue; 
      
      if (existingPaymentIds.has(referenceId)) {
        continue;
      }

      newPayments.push({
        organization_id: organizationId,
        invoice_id: invoiceId,
        amount: Number(p.amount ?? 0),
        currency: String(p.currencyRate || 'USD'),
        payment_date: toIsoDate(p.date),
        payment_method: "xero",
        reference_id: referenceId,
        notes: p.reference || "Xero sync",
      });
    }

    if (newPayments.length > 0) {
      const { error: insertError } = await supabase.from("payments").insert(newPayments);
      if (insertError) {
        logger.error({ message: "Failed to insert exact payments from Xero", context: "syncXeroDataPageForOrg", error: insertError.message, organization_id: organizationId });
      } else {
        result.imported += newPayments.length;
      }
    }
    
    if (!result.hasMore) {
      await supabase.from("integrations").update({ last_synced_at: new Date().toISOString() }).eq("organization_id", organizationId).eq("provider", XERO_PROVIDER);
    }
    
    return result;
  }
  
  throw new Error("Invalid syncType");
}

export async function getXeroTotalPages(organizationId: string, syncType: "invoices" | "payments"): Promise<number> {
  const integration = await getXeroIntegration(organizationId);
  if (!integration) throw new Error("Xero is not connected.");

  let minPage = 1;
  let maxPage = 10000;
  let current = 1;

  async function fetchPageCount(page: number) {
    const { result } = await withXeroRetry(integration!, async (client, intg) => {
      if (syncType === "invoices") {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const year = twoYearsAgo.getFullYear();
        const month = String(twoYearsAgo.getMonth() + 1).padStart(2, '0');
        const day = String(twoYearsAgo.getDate()).padStart(2, '0');
        const whereClause = `Type=="ACCREC" AND (Status!="PAID" OR (Status=="PAID" AND Date >= DateTime(${year}, ${month}, ${day})))`;
        return client.accountingApi.getInvoices(intg.tenant_id, undefined, whereClause, "UpdatedDateUTC DESC", undefined, undefined, undefined, ["AUTHORISED", "PAID", "DRAFT", "SUBMITTED"], page, false, undefined, undefined, false, 100);
      } else {
        return client.accountingApi.getPayments(intg.tenant_id, undefined, 'Status=="AUTHORISED"', "UpdatedDateUTC DESC", page);
      }
    });
    if (syncType === "invoices") return (result.body as any).invoices?.length || 0;
    return (result.body as any).payments?.length || 0;
  }

  while (true) {
    const count = await fetchPageCount(current);
    if (count < 100) return current;
    minPage = current;
    current *= 2;
    if (current > maxPage) {
      maxPage = current;
    } else {
      const nextCount = await fetchPageCount(current);
      if (nextCount < 100) {
        if (nextCount > 0) return current;
        maxPage = current;
        break;
      }
    }
  }

  while (minPage <= maxPage) {
    const mid = Math.floor((minPage + maxPage) / 2);
    const count = await fetchPageCount(mid);
    if (count > 0 && count < 100) return mid;
    if (count === 100) {
      const nextCount = await fetchPageCount(mid + 1);
      if (nextCount === 0) return mid;
      minPage = mid + 1;
    } else if (count === 0) {
      maxPage = mid - 1;
    }
  }

  return minPage;
}


export async function getXeroBankAccounts(organizationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: integration } = await supabase.from("integrations").select("*").eq("organization_id", organizationId).eq("provider", "xero").maybeSingle<XeroIntegrationRow>();
  if (!integration || !integration.tenant_id) return [];
  try {
    const { result: response } = await withXeroRetry(integration, async (client, intg) => {
      return client.accountingApi.getAccounts(intg.tenant_id, undefined, 'Type=="BANK"');
    });
    const accounts = response.body.accounts || [];
    const defaultAccountId = integration.xero_default_account_id;
    return accounts
      .filter(acc => acc.bankAccountNumber && (!defaultAccountId || acc.accountID === defaultAccountId))
      .map(acc => ({ provider: "xero", name: acc.name, accountNumber: acc.bankAccountNumber, currency: acc.currencyCode }));
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
