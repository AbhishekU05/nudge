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
  user_id: string;
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
    .eq("user_id", integration.user_id)
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

  return syncQuickBooksInvoicesForUser(statePayload.userId);
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || null;
}

async function getQuickBooksIntegration(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("user_id", userId)
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

async function loadExistingQuickBooksCustomers(userId: string, invoiceIds: string[]) {
  if (invoiceIds.length === 0) return new Map<string, ExistingCustomerRow>();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, recipient_email, recipient_name, quickbooks_invoice_id, amount_paid, internal_notes")
    .eq("user_id", userId)
    .in("quickbooks_invoice_id", invoiceIds)
    .returns<ExistingCustomerRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((row) => [row.quickbooks_invoice_id ?? "", row]));
}

export async function syncQuickBooksInvoicesForUser(userId: string): Promise<QuickBooksSyncResult> {
  const integration = await getQuickBooksIntegration(userId);
  if (!integration || !integration.realm_id) {
    throw new Error("QuickBooks is not connected.");
  }

  const validIntegration = await getValidQuickBooksTokens(integration);
  const invoices = await fetchAllQuickBooksInvoices(validIntegration.access_token, integration.realm_id);
  
  const customerIds = [...new Set<string>(invoices.map((inv: any) => inv.CustomerRef?.value).filter(Boolean))];
  const qbCustomers = await fetchQuickBooksCustomers(validIntegration.access_token, integration.realm_id, customerIds);

  const invoiceIds = invoices.map((invoice: any) => invoice.Id).filter(Boolean);
  const existingByInvoiceId = await loadExistingQuickBooksCustomers(userId, invoiceIds);
  const supabase = createSupabaseAdminClient();
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
    
    const amountDue = Number(invoice.Balance ?? 0);
    const totalAmount = Number(invoice.TotalAmt ?? 0);
    const isPaid = amountDue <= 0;
    
    let status = "outstanding";
    if (isPaid) status = "paid";
    else if (amountDue < totalAmount) status = "partial";
    else if (invoice.DueDate && new Date(invoice.DueDate) < new Date()) status = "overdue";

    const qbCustomer = qbCustomers.get(invoice.CustomerRef?.value);
    const contactName = qbCustomer?.DisplayName || qbCustomer?.FullyQualifiedName || "QuickBooks Customer";
    const email = normalizeEmail(qbCustomer?.PrimaryEmailAddr?.Address ?? invoice.BillEmail?.Address) ?? existing?.recipient_email ?? "";
    const amountPaid = Math.min(totalAmount, totalAmount - amountDue);
    const existingAmountPaid = existing ? Number(existing.amount_paid || 0) : 0;
    const newlyPaid = amountPaid - existingAmountPaid;
    const qbNotes = invoice.PrivateNote ? `QB Note: ${invoice.PrivateNote}` : null;

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
        .update(isPaid ? { ...payload, active: false } : payload)
        .eq("id", existing.id)
        .eq("user_id", userId);

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
          customer_id: existing.id,
          user_id: userId,
          event_type: "payment",
          event_date: new Date().toISOString().slice(0, 10),
          amount: newlyPaid,
          currency: payload.currency,
          payment_source: "user",
        });
      }

      continue;
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({ 
        user_id: userId, 
        name: contactName,
        email: email,
        next_send_at: computeFirstReminderSendAt() 
      })
      .select("id")
      .single();

    if (clientError) {
      throw new Error(clientError.message);
    }

    const { data: newCustomer, error } = await supabase.from("invoices").insert({
      ...payload,
      customer_id: client.id,
      custom_message: null,
      payment_link: null,
      user_id: userId,
    }).select("id").single();


    if (error) {
      throw new Error(error.message);
    }

    if (newlyPaid > 0 && newCustomer) {
      newPaymentLogs.push({
        customer_id: newCustomer.id,
        user_id: userId,
        event_type: "payment",
        event_date: new Date().toISOString().slice(0, 10),
        amount: newlyPaid,
        currency: payload.currency,
        payment_source: "user",
      });
    }

    result.imported += 1;
  }

  if (newPaymentLogs.length > 0) {
    const { error: logsError } = await supabase.from("customer_events").insert(newPaymentLogs);
    if (logsError) {
      logger.error({
        message: "Failed to insert payment logs from QuickBooks sync",
        context: "syncQuickBooksInvoicesForUser",
        error: logsError.message,
        user_id: userId,
      });
    }
  }

  const { error: syncError } = await supabase
    .from("integrations")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("provider", QUICKBOOKS_PROVIDER);

  if (syncError) {
    throw new Error(syncError.message);
  }

  logger.external({
    service: "QuickBooks",
    action: "sync_invoices",
    success: true,
    user_id: userId,
  });

  return result;
}

export async function revokeQuickBooksIntegration(userId: string) {
  const integration = await getQuickBooksIntegration(userId);
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
      user_id: userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
