/* eslint-disable */
import "server-only";

import crypto from "crypto";

import { getRequiredEnv } from "@/lib/env";
import { getAppUrl } from "@/lib/email/reminder";
import { logger } from "@/lib/logger";
import { computeFirstReminderSendAt } from "@/lib/reminder-schedule";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const QUICKBOOKS_PROVIDER = "quickbooks";
const QUICKBOOKS_SCOPES = ["com.intuit.quickbooks.accounting"];

const STATE_MAX_AGE_MS = 10 * 60 * 1000;
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;

type QuickBooksStatePayload = {
  createdAt: number;
  nonce: string;
  userId: string;
};

export type QuickBooksIntegrationRow = {
  organization_id: string;
  provider: "quickbooks";
  access_token: string;
  refresh_token: string;
  expires_at: string;
  realm_id: string | null;
  last_synced_at: string | null;
  quickbooks_default_account_id?: string | null;
  quickbooks_default_account_name?: string | null;
};

export type QuickBooksSyncResult = {
  imported: number;
  markedPaid: number;
  skipped: number;
  totalInvoices: number;
  updated: number;
};

type ExistingInvoiceRow = {
  id: string;
  client_id: string;
  quickbooks_id: string;
  amount: number;
  status: string;
  updated_at: string;
};

import { getQuickBooksMode } from "@/lib/platform-settings";

async function getQuickBooksClientId() {
  const mode = await getQuickBooksMode();
  return mode === "sandbox"
    ? getRequiredEnv("QUICKBOOKS_DEV_CLIENT_ID")
    : getRequiredEnv("QUICKBOOKS_CLIENT_ID");
}

async function getQuickBooksClientSecret() {
  const mode = await getQuickBooksMode();
  return mode === "sandbox"
    ? getRequiredEnv("QUICKBOOKS_DEV_CLIENT_SECRET")
    : getRequiredEnv("QUICKBOOKS_CLIENT_SECRET");
}

function getQuickBooksStateSecret() {
  return process.env.QUICKBOOKS_STATE_SECRET ?? getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}

async function isSandbox() {
  const mode = await getQuickBooksMode();
  return mode === "sandbox";
}

export async function getApiBaseUrl() {
  const sandbox = await isSandbox();
  return sandbox
    ? "https://sandbox-quickbooks.api.intuit.com"
    : "https://quickbooks.api.intuit.com";
}

export function getQuickBooksCallbackUrl() {
  return `${getAppUrl()}/api/integrations/quickbooks/callback`;
}

function signStatePayload(encodedPayload: string) {
  return crypto
    .createHmac("sha256", getQuickBooksStateSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createQuickBooksState(userId: string) {
  const payload: QuickBooksStatePayload = {
    createdAt: Date.now(),
    nonce: crypto.randomUUID(),
    userId,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signStatePayload(encodedPayload)}`;
}

function verifyQuickBooksState(state: string): QuickBooksStatePayload {
  const [encodedPayload, signature] = state.split(".");
  if (!encodedPayload || !signature) {
    throw new Error("Invalid QuickBooks OAuth state.");
  }

  const expected = signStatePayload(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid QuickBooks OAuth state signature.");
  }

  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8"),
  ) as QuickBooksStatePayload;

  if (!payload.userId || Date.now() - payload.createdAt > STATE_MAX_AGE_MS) {
    throw new Error("Expired QuickBooks OAuth state.");
  }

  return payload;
}

export async function buildQuickBooksConsentUrl(userId: string) {
  const state = createQuickBooksState(userId);
  const url = new URL("https://appcenter.intuit.com/connect/oauth2");
  const clientId = await getQuickBooksClientId();
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", QUICKBOOKS_SCOPES.join(" "));
  url.searchParams.set("redirect_uri", getQuickBooksCallbackUrl());
  url.searchParams.set("state", state);
  return url.toString();
}

async function fetchTokens(params: URLSearchParams) {
  const clientId = await getQuickBooksClientId();
  const clientSecret = await getQuickBooksClientSecret();
  const authHeader = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

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

function tokenNeedsRefresh(expiresAt: string) {
  return new Date(expiresAt).getTime() - Date.now() <= TOKEN_REFRESH_SKEW_MS;
}

export async function getValidQuickBooksTokens(integration: QuickBooksIntegrationRow) {
  if (!tokenNeedsRefresh(integration.expires_at)) {
    return integration;
  }

  const params = new URLSearchParams();
  params.set("grant_type", "refresh_token");
  params.set("refresh_token", integration.refresh_token);

  const tokenData = await fetchTokens(params);

  const updatedIntegration: QuickBooksIntegrationRow = {
    ...integration,
    access_token: tokenData.access_token,
    expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    refresh_token: tokenData.refresh_token || integration.refresh_token,
  };

  const supabase = createSupabaseAdminClient();
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

export async function completeQuickBooksOAuthCallback(code: string, realmId: string, state: string) {
  const statePayload = verifyQuickBooksState(state);
  
  const params = new URLSearchParams();
  params.set("grant_type", "authorization_code");
  params.set("code", code);
  params.set("redirect_uri", getQuickBooksCallbackUrl());

  const tokenData = await fetchTokens(params);

  const supabase = createSupabaseAdminClient();

  // Find org id
  const { data: member } = await supabase.from("organization_members").select("organization_id").eq("user_id", statePayload.userId).single();
  if (!member) throw new Error("User has no organization");

  const { error } = await supabase.from("integrations").upsert(
    {
      organization_id: member.organization_id,
      provider: QUICKBOOKS_PROVIDER,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      realm_id: realmId,
    },
    { onConflict: "organization_id,provider" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return { organizationId: member.organization_id };
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

export async function getQuickBooksIntegration(organizationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", QUICKBOOKS_PROVIDER)
    .maybeSingle<QuickBooksIntegrationRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getQuickBooksIntegrationByRealmId(realmId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("realm_id", realmId)
    .eq("provider", QUICKBOOKS_PROVIDER)
    .maybeSingle<QuickBooksIntegrationRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function fetchAllQuickBooksInvoices(accessToken: string, realmId: string) {
  const invoices: any[] = [];
  const maxResults = 1000;

  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const dateStr = twoYearsAgo.toISOString().split('T')[0];

  const queries = [
    `select * from Invoice where Balance > '0'`,
    `select * from Invoice where Balance = '0' and MetaData.LastUpdatedTime > '${dateStr}'`
  ];

  for (const baseQuery of queries) {
    let startPosition = 1;
    while (true) {
      const query = `${baseQuery} STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;
      
      const url = new URL(`${await getApiBaseUrl()}/v3/company/${realmId}/query`);
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
  }

  return invoices;
}

async function fetchAllQuickBooksPayments(accessToken: string, realmId: string) {
  const payments: any[] = [];
  let startPosition = 1;
  const maxResults = 1000;

  while (true) {
    const query = `select * from Payment STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;
    
    const url = new URL(`${await getApiBaseUrl()}/v3/company/${realmId}/query`);
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
      throw new Error(`Failed to fetch QuickBooks payments: ${text}`);
    }

    const data = await response.json();
    const batch = data.QueryResponse?.Payment || [];
    payments.push(...batch);

    if (batch.length < maxResults) {
      break;
    }
    startPosition += maxResults;
  }

  return payments;
}


async function fetchQuickBooksCustomers(accessToken: string, realmId: string, customerIds: string[]) {
  if (customerIds.length === 0) return new Map();

  const query = `select * from Customer where Id in (${customerIds.map(id => `'${id}'`).join(",")})`;
  const url = new URL(`${await getApiBaseUrl()}/v3/company/${realmId}/query`);
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
  return new Map(customers.map((c: any) => [c.Id, c]));
}

async function loadExistingQuickBooksInvoices(organizationId: string, invoiceIds: string[]) {
  if (invoiceIds.length === 0) return new Map<string, ExistingInvoiceRow>();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, client_id, quickbooks_id, amount, status, updated_at")
    .eq("organization_id", organizationId)
    .in("quickbooks_id", invoiceIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((row) => [row.quickbooks_id ?? "", row as ExistingInvoiceRow]));
}

export async function syncQuickBooksInvoicesForOrg(organizationId: string): Promise<QuickBooksSyncResult> {
  const integration = await getQuickBooksIntegration(organizationId);
  if (!integration || !integration.realm_id) {
    throw new Error("QuickBooks is not connected.");
  }

  const validIntegration = await getValidQuickBooksTokens(integration);
  const invoices = await fetchAllQuickBooksInvoices(validIntegration.access_token, integration.realm_id);
  
  const customerIds = [...new Set<string>(invoices.map((inv: any) => inv.CustomerRef?.value).filter(Boolean))];
  const qbCustomers = await fetchQuickBooksCustomers(validIntegration.access_token, integration.realm_id, customerIds);

  const invoiceIds = invoices.map((invoice: any) => invoice.Id).filter(Boolean);
  const existingByInvoiceId = await loadExistingQuickBooksInvoices(organizationId, invoiceIds);
  const supabase = createSupabaseAdminClient();
  const { data: clientsData } = await supabase.from("clients").select("id, name, email").eq("organization_id", organizationId);
  const clientsMap = new Map<string, { id: string }>();
  for (const client of clientsData || []) {
    if (client.email) clientsMap.set(client.email.toLowerCase(), client);
    if (client.name) clientsMap.set(client.name.toLowerCase(), client);
  }

  const result: QuickBooksSyncResult = {
    imported: 0,
    markedPaid: 0,
    skipped: 0,
    totalInvoices: invoices.length,
    updated: 0,
  };

  // Resolve every invoice's client up front and create any missing ones in a
  // single bulk insert, instead of one insert per unmatched invoice - with a
  // few hundred distinct customers that used to be a few hundred round trips.
  const newClientsByKey = new Map<string, { name: string; email: string }>();
  for (const invoice of invoices) {
    const qbCustomer = qbCustomers.get(invoice.CustomerRef?.value);
    const contactName = qbCustomer?.DisplayName || invoice.CustomerRef?.name?.trim() || "QuickBooks customer";
    const email = normalizeEmail(invoice.BillEmail?.Address || qbCustomer?.PrimaryEmailAddr?.Address) || "";
    const existingRecord = (email && clientsMap.get(email.toLowerCase())) || clientsMap.get(contactName.toLowerCase());
    if (!existingRecord) {
      const key = (email || contactName).toLowerCase();
      if (!newClientsByKey.has(key)) newClientsByKey.set(key, { name: contactName, email });
    }
  }

  if (newClientsByKey.size > 0) {
    const { data: createdClients, error: clientError } = await supabase
      .from("clients")
      .insert(Array.from(newClientsByKey.values()).map((c) => ({ organization_id: organizationId, name: c.name, email: c.email })))
      .select("id, name, email");

    if (clientError) throw new Error(clientError.message);

    for (const client of createdClients || []) {
      if (client.email) clientsMap.set(client.email.toLowerCase(), client);
      if (client.name) clientsMap.set(client.name.toLowerCase(), client);
    }
  }

  // Build every invoice payload in memory, then write in chunked batches
  // instead of one upsert per invoice - with a few thousand invoices per org,
  // a sequential per-row loop can take minutes and blow past Inngest's step
  // timeout. See invoices_org_quickbooks_id_unique for the upsert target.
  const payloadsToWrite: Record<string, unknown>[] = [];

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
    if (isPaid) status = "paid";
    else if (amountPaid > 0 && amountPaid < totalAmount) status = "partial";
    else if (invoice.DueDate && new Date(invoice.DueDate) < new Date()) status = "overdue";

    const qbUpdatedDate = invoice.MetaData?.LastUpdatedTime ? new Date(invoice.MetaData.LastUpdatedTime) : new Date(0);

    if (totalAmount <= 0) {
      result.skipped += 1;
      continue;
    }

    let clientRecord = email ? clientsMap.get(email.toLowerCase()) : undefined;
    if (!clientRecord) clientRecord = clientsMap.get(contactName.toLowerCase());
    if (!clientRecord) {
      // Should not happen - every invoice's client was resolved/created above.
      result.skipped += 1;
      continue;
    }

    const existing = existingByInvoiceId.get(invoiceId);

    if (existing) {
      const duelyUpdatedDate = new Date(existing.updated_at || 0);

      // Dual Sync Truth check: if Duely has more recent updates, DO NOT overwrite it from QuickBooks.
      if (duelyUpdatedDate > qbUpdatedDate) {
        result.skipped += 1;
        continue;
      }

      if (status === "paid" && existing.status !== "paid") result.markedPaid += 1;
      else result.updated += 1;
    } else {
      result.imported += 1;
    }

    payloadsToWrite.push({
      organization_id: organizationId,
      client_id: clientRecord.id,
      amount: totalAmount,
      currency: String(invoice.CurrencyRef?.value ?? "USD"),
      due_date: toIsoDate(invoice.DueDate),
      status: status,
      quickbooks_id: invoiceId,
      invoice_number: invoice.DocNumber || null,
      payment_link: invoice.InvoiceLink || null,
      updated_at: new Date().toISOString(),
      reminders_enabled: false
    });
  }

  // Upsert (not insert) so a concurrent sync that already inserted one of
  // these quickbooks_ids since our lookup above updates the existing row
  // instead of racing to create a second one. See invoices_org_quickbooks_id_unique.
  const UPSERT_CHUNK_SIZE = 500;
  for (let i = 0; i < payloadsToWrite.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = payloadsToWrite.slice(i, i + UPSERT_CHUNK_SIZE);
    const { error } = await supabase
      .from("invoices")
      .upsert(chunk, { onConflict: "organization_id,quickbooks_id" });
    if (error) throw new Error(error.message);
  }

  // Fetch and insert actual payments from QuickBooks
  const qbPayments = await fetchAllQuickBooksPayments(validIntegration.access_token, validIntegration.realm_id!);
  const paymentIds = qbPayments.map(p => p.Id).filter(Boolean);
  
  if (paymentIds.length > 0) {
    const { data: existingPayments } = await supabase
      .from("payments")
      .select("reference_id")
      .eq("organization_id", organizationId)
      .in("reference_id", paymentIds);
      
    const existingPaymentIds = new Set(existingPayments?.map(p => p.reference_id) || []);
    
    // We need to map quickbooks_invoice_id to duely invoice_id
    const { data: allInvoices } = await supabase
      .from("invoices")
      .select("id, quickbooks_id")
      .eq("organization_id", organizationId);
      
    const qbIdToDuelyId = new Map(allInvoices?.map(inv => [inv.quickbooks_id, inv.id]) || []);
    const newPayments = [];
    
    for (const p of qbPayments) {
      if (existingPaymentIds.has(p.Id)) continue;
      
      const pDate = toIsoDate(p.TxnDate) || new Date().toISOString().substring(0, 10);
      const currency = p.CurrencyRef?.value || "USD";
      
      if (p.Line && Array.isArray(p.Line)) {
        for (const line of p.Line) {
          const amount = Number(line.Amount || 0);
          if (amount <= 0) continue;
          
          const linkedTxn = line.LinkedTxn?.find((txn: any) => txn.TxnType === "Invoice");
          if (!linkedTxn || !linkedTxn.TxnId) continue;
          
          const duelyInvoiceId = qbIdToDuelyId.get(linkedTxn.TxnId);
          if (!duelyInvoiceId) continue;
          
          newPayments.push({
            organization_id: organizationId,
            invoice_id: duelyInvoiceId,
            amount: amount,
            currency: currency,
            payment_date: pDate,
            payment_method: "quickbooks_sync",
            reference_id: p.Id
          });
        }
      }
    }
    
    if (newPayments.length > 0) {
      const { error: logsError } = await supabase.from("payments").insert(newPayments);
      if (logsError) {
        logger.error({ message: "Failed to insert exact payments from QuickBooks", context: "syncQuickBooksInvoicesForOrg", error: logsError.message, organization_id: organizationId });
      }
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

  logger.external({
    service: "QuickBooks",
    action: "sync_invoices",
    success: true,
    organization_id: organizationId,
  });

  return result;
}

export async function revokeQuickBooksIntegration(organizationId: string) {
  const integration = await getQuickBooksIntegration(organizationId);
  if (!integration) return;

  try {
    const authHeader = Buffer.from(
      `${getQuickBooksClientId()}:${getQuickBooksClientSecret()}`
    ).toString("base64");

    await fetch("https://developer.intuit.com/v2/oauth2/tokens/revoke", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Basic ${authHeader}`,
      },
      body: JSON.stringify({ token: integration.refresh_token }),
    });
  } catch (error) {
    logger.external({
      service: "QuickBooks",
      action: "revoke_token",
      success: false,
      organization_id: organizationId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getQuickBooksBankAccounts(organizationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", "quickbooks")
    .maybeSingle<QuickBooksIntegrationRow>();

  if (!integration || !integration.realm_id) return [];

  try {
    const validIntegration = await getValidQuickBooksTokens(integration);
    const query = `select * from Account where AccountType = 'Bank'`;
    const url = new URL(`${await getApiBaseUrl()}/v3/company/${integration.realm_id}/query`);
    url.searchParams.set("query", query);
    url.searchParams.set("minorversion", "65");

    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${validIntegration.access_token}`,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const accounts = data.QueryResponse?.Account || [];
    const defaultAccountId = integration.quickbooks_default_account_id;
    return accounts
      .filter((acc: any) => !defaultAccountId || acc.Id === defaultAccountId)
      .map((acc: any) => ({
        provider: "quickbooks",
        name: acc.Name,
        accountNumber: acc.AcctNum || acc.Id,
        currency: acc.CurrencyRef?.value
      }));
  } catch (error) {
    logger.error({ message: "Failed to fetch QuickBooks bank accounts", context: "quickbooks_bank_sync", original_error: String(error) });
    return [];
  }
}

export async function fetchQuickBooksInvoice(accessToken: string, realmId: string, invoiceId: string) {
  const url = new URL(`${await getApiBaseUrl()}/v3/company/${realmId}/invoice/${invoiceId}`);
  url.searchParams.set("minorversion", "65");

  const response = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    const text = await response.text();
    throw new Error(`Failed to fetch QuickBooks invoice: ${text}`);
  }

  const data = await response.json();
  return data.Invoice;
}

export async function fetchQuickBooksPayment(accessToken: string, realmId: string, paymentId: string) {
  const url = new URL(`${await getApiBaseUrl()}/v3/company/${realmId}/payment/${paymentId}`);
  url.searchParams.set("minorversion", "65");

  const response = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    const text = await response.text();
    throw new Error(`Failed to fetch QuickBooks payment: ${text}`);
  }

  const data = await response.json();
  return data.Payment;
}
