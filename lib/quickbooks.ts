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
};

export type QuickBooksSyncResult = {
  imported: number;
  markedPaid: number;
  skipped: number;
  totalInvoices: number;
  updated: number;
};

type ExistingCustomerRow = {
  id: string;
  customer_id?: string | null;
  recipient_email: string;
  recipient_name: string;
  quickbooks_invoice_id: string | null;
  amount_paid?: number;
  internal_notes?: string | null;
};

function getQuickBooksClientId() {
  return getRequiredEnv("QUICKBOOKS_CLIENT_ID");
}

function getQuickBooksClientSecret() {
  return getRequiredEnv("QUICKBOOKS_CLIENT_SECRET");
}

function getQuickBooksStateSecret() {
  return process.env.QUICKBOOKS_STATE_SECRET ?? getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}

function isSandbox() {
  return process.env.QUICKBOOKS_ENVIRONMENT === "sandbox" || getQuickBooksClientId().startsWith("AB") === false;
}

function getApiBaseUrl() {
  return isSandbox()
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
  url.searchParams.set("client_id", getQuickBooksClientId());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", QUICKBOOKS_SCOPES.join(" "));
  url.searchParams.set("redirect_uri", getQuickBooksCallbackUrl());
  url.searchParams.set("state", state);
  return url.toString();
}

async function fetchTokens(params: URLSearchParams) {
  const authHeader = Buffer.from(
    `${getQuickBooksClientId()}:${getQuickBooksClientSecret()}`
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

async function getValidQuickBooksTokens(integration: QuickBooksIntegrationRow) {
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
  const { error } = await supabase.from("integrations").upsert(
    {
      user_id: statePayload.userId,
      provider: QUICKBOOKS_PROVIDER,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      realm_id: realmId,
    },
    { onConflict: "user_id,provider" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return syncQuickBooksInvoicesForOrg(statePayload.userId); // Will need to resolve to organization_id later if needed
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || null;
}

async function getQuickBooksIntegration(organizationId: string) {
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

async function fetchAllQuickBooksInvoices(accessToken: string, realmId: string) {
  const invoices: any[] = [];
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

async function fetchQuickBooksCustomers(accessToken: string, realmId: string, customerIds: string[]) {
  if (customerIds.length === 0) return new Map();

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
  return new Map(customers.map((c: any) => [c.Id, c]));
}

async function loadExistingQuickBooksCustomers(organizationId: string, invoiceIds: string[]) {
  if (invoiceIds.length === 0) return new Map<string, ExistingCustomerRow>();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, client_id, recipient_email, recipient_name, quickbooks_invoice_id, amount_paid, internal_notes")
    .eq("organization_id", organizationId)
    .in("quickbooks_invoice_id", invoiceIds)
    .returns<ExistingCustomerRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((row) => [row.quickbooks_invoice_id ?? "", row]));
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
  const existingByInvoiceId = await loadExistingQuickBooksCustomers(organizationId, invoiceIds);
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
  const newPaymentLogs: any[] = [];

  for (const invoice of invoices) {
    const invoiceId = invoice.Id;
    if (!invoiceId) {
      result.skipped += 1;
      continue;
    }

    const existing = existingByInvoiceId.get(invoiceId);

    const amountPaid = Number(invoice.TotalAmt ?? 0) - Number(invoice.Balance ?? invoice.TotalAmt ?? 0);
    const totalAmount = Number(invoice.TotalAmt ?? 0);
    const isPaid = totalAmount > 0 && Number(invoice.Balance ?? totalAmount) <= 0;
    
    let status = "outstanding";
    if (isPaid) status = "paid";
    else if (amountPaid > 0 && amountPaid < totalAmount) status = "partial";
    else if (invoice.DueDate && new Date(invoice.DueDate) < new Date()) status = "overdue";

    const contactName = invoice.CustomerRef?.name?.trim() || "QuickBooks customer";
    const email = normalizeEmail(invoice.BillEmail?.Address) ?? existing?.recipient_email ?? "";
    const existingAmountPaid = existing ? Number(existing.amount_paid || 0) : 0;
    const newlyPaid = amountPaid - existingAmountPaid;
    const qbNotes = invoice.DocNumber ? `QB Doc: ${invoice.DocNumber}` : null;
    
    const paymentDateStr = invoice.MetaData?.LastUpdatedTime || new Date().toISOString();
    const paymentDate = new Date(paymentDateStr).toISOString().slice(0, 10);

    if (totalAmount <= 0) {
      result.skipped += 1;
      continue;
    }

    const payload = {
      amount_owed: totalAmount,
      amount_paid: isPaid ? totalAmount : amountPaid,
      currency: String(invoice.CurrencyRef?.value ?? "USD"),
      due_date: invoice.DueDate || null,
      recipient_email: email,
      recipient_name: contactName,
      workflow_status: status,
      quickbooks_invoice_id: invoiceId,
      invoice_number: invoice.DocNumber || `INV-${invoiceId.substring(0, 8)}`,
      internal_notes: existing?.internal_notes || qbNotes,
    };

    if (existing) {
      const { error } = await supabase
        .from("invoices")
        .update(payload)
        .eq("id", existing.id)
        .eq("organization_id", organizationId);

      if (error) {
        throw new Error(error.message);
      }

      if (isPaid) {
        result.markedPaid += 1;
      } else {
        result.updated += 1;
      }

      if (newlyPaid > 0) {
        newPaymentLogs.push({
          invoice_id: existing.id,
          client_id: existing.customer_id ?? null,
          organization_id: organizationId,
          event_type: "payment",
          event_date: paymentDate,
          amount: newlyPaid,
          currency: payload.currency,
          payment_source: "user", // Keep matching PaymentSourceBadge format if required
        });
      }

      continue;
    }

    let clientRecord = email ? clientsMap.get(email.toLowerCase()) : undefined;
    if (!clientRecord) {
      clientRecord = clientsMap.get(contactName.toLowerCase());
    }

    if (!clientRecord) {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({ 
          organization_id: organizationId, 
          name: contactName,
          email: email,
          next_send_at: computeFirstReminderSendAt() 
        })
        .select("id")
        .single();

      if (clientError) {
        throw new Error(clientError.message);
      }
      
      clientRecord = { id: client.id };
      if (email) clientsMap.set(email.toLowerCase(), clientRecord);
      clientsMap.set(contactName.toLowerCase(), clientRecord);
    }

    const { data: newCustomer, error } = await supabase.from("invoices").insert({
      ...payload,
      client_id: clientRecord.id,
      custom_message: null,
      payment_link: null,
      organization_id: organizationId,
    }).select("id").single();


    if (error) {
      throw new Error(error.message);
    }

    if (newlyPaid > 0 && newCustomer) {
      newPaymentLogs.push({
        invoice_id: newCustomer.id,
        client_id: clientRecord.id,
        organization_id: organizationId,
        event_type: "payment",
        event_date: paymentDate,
        amount: newlyPaid,
        currency: payload.currency,
        payment_source: "user",
      });
    }

    result.imported += 1;
  }

  if (newPaymentLogs.length > 0) {
    const { error: logsError } = await supabase.from("events").insert(newPaymentLogs); // Assuming customer_events is now events based on previous edits
    if (logsError) {
      logger.error({
        message: "Failed to insert payment logs from QuickBooks sync",
        context: "syncQuickBooksInvoicesForOrg",
        error: logsError.message,
        organization_id: organizationId,
      });
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

export async function getQuickBooksBankAccounts(organizationId: string) {
  const integration = await getQuickBooksIntegration(organizationId);
  if (!integration || !integration.realm_id) return [];

  const { access_token } = await getValidQuickBooksTokens(integration);

  const query = `select * from Account where AccountType = 'Bank'`;
  const url = new URL(`${getApiBaseUrl()}/v3/company/${integration.realm_id}/query`);
  url.searchParams.set("query", query);
  url.searchParams.set("minorversion", "65");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${access_token}`,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const accounts = data.QueryResponse?.Account || [];

    return accounts.map((acc: any) => ({
      provider: "quickbooks",
      name: acc.Name,
      accountNumber: acc.AcctNum || "N/A",
      currency: acc.CurrencyRef?.value || "USD"
    }));
  } catch (error) {
    logger.error({ message: "Failed to fetch QuickBooks bank accounts", context: "quickbooks_bank_sync", original_error: String(error) });
    return [];
  }
}

export async function revokeQuickBooksIntegration(organizationId: string) {
  const integration = await getQuickBooksIntegration(organizationId);
  if (!integration) return;

  try {
    const validIntegration = await getValidQuickBooksTokens(integration);
    const authHeader = Buffer.from(
      `${getQuickBooksClientId()}:${getQuickBooksClientSecret()}`
    ).toString("base64");

    const response = await fetch("https://developer.api.intuit.com/v2/oauth2/tokens/revoke", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Basic ${authHeader}`,
      },
      body: JSON.stringify({ token: validIntegration.refresh_token || validIntegration.access_token }),
    });
    
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
    }
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
