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
  user_id: string;
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

type ExistingCustomerRow = {
  id: string;
  customer_id?: string | null;
  recipient_email: string;
  recipient_name: string;
  xero_invoice_id: string | null;
  amount_paid?: number;
  internal_notes?: string | null;
};

function getXeroClientId() {
  return getRequiredEnv("XERO_CLIENT_ID");
}

function getXeroClientSecret() {
  return getRequiredEnv("XERO_CLIENT_SECRET");
}

function getXeroStateSecret() {
  return process.env.XERO_STATE_SECRET ?? getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}

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
  return crypto
    .createHmac("sha256", getXeroStateSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createXeroState(userId: string) {
  const payload: XeroStatePayload = {
    createdAt: Date.now(),
    nonce: crypto.randomUUID(),
    userId,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signStatePayload(encodedPayload)}`;
}

function verifyXeroState(state: string): XeroStatePayload {
  const [encodedPayload, signature] = state.split(".");
  if (!encodedPayload || !signature) {
    throw new Error("Invalid Xero OAuth state.");
  }

  const expected = signStatePayload(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid Xero OAuth state signature.");
  }

  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8"),
  ) as XeroStatePayload;

  if (!payload.userId || Date.now() - payload.createdAt > STATE_MAX_AGE_MS) {
    throw new Error("Expired Xero OAuth state.");
  }

  return payload;
}

export async function buildXeroConsentUrl(userId: string) {
  const state = createXeroState(userId);
  return createXeroClient(state).buildConsentUrl();
}

function getTokenExpiresAt(tokenSet: TokenSet) {
  const token = tokenSet as TokenSet & { expires_at?: number; expires_in?: number };
  if (token.expires_at) {
    return new Date(token.expires_at * 1000).toISOString();
  }
  const expiresInSeconds = token.expires_in ?? 1800;
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
}

function requireTokenValues(tokenSet: TokenSet) {
  if (!tokenSet.access_token || !tokenSet.refresh_token) {
    throw new Error("Xero did not return a complete OAuth token set.");
  }

  return {
    accessToken: tokenSet.access_token,
    expiresAt: getTokenExpiresAt(tokenSet),
    refreshToken: tokenSet.refresh_token,
  };
}

function storedTokenSet(integration: XeroIntegrationRow) {
  return {
    access_token: integration.access_token,
    expires_at: Math.floor(new Date(integration.expires_at).getTime() / 1000),
    refresh_token: integration.refresh_token,
  };
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
  const refreshedTokenSet = await xero.refreshWithRefreshToken(
    getXeroClientId(),
    getXeroClientSecret(),
    integration.refresh_token,
  );
  const tokenValues = requireTokenValues(refreshedTokenSet);
  const updatedIntegration: XeroIntegrationRow = {
    ...integration,
    access_token: tokenValues.accessToken,
    expires_at: tokenValues.expiresAt,
    refresh_token: tokenValues.refreshToken,
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
    .eq("provider", XERO_PROVIDER);

  if (error) {
    throw new Error(error.message);
  }

  return { integration: updatedIntegration, xero };
}

export async function completeXeroOAuthCallback(callbackUrl: string, state: string) {
  const statePayload = verifyXeroState(state);
  const xero = createXeroClient(state);
  const tokenSet = await xero.apiCallback(callbackUrl);
  const tokenValues = requireTokenValues(tokenSet);
  const tenants = await xero.updateTenants(false);
  const tenantId = tenants[0]?.tenantId as string | undefined;

  if (!tenantId) {
    throw new Error("No Xero organisation was connected.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("integrations").upsert(
    {
      user_id: statePayload.userId,
      provider: XERO_PROVIDER,
      access_token: tokenValues.accessToken,
      refresh_token: tokenValues.refreshToken,
      expires_at: tokenValues.expiresAt,
      tenant_id: tenantId,
    },
    { onConflict: "user_id,provider" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return syncXeroInvoicesForUser(statePayload.userId);
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || null;
}

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function getWorkflowStatus(invoice: Invoice) {
  const amountDue = Number(invoice.amountDue ?? 0);
  const amountPaid = Number(invoice.amountPaid ?? 0);
  const dueDate = toIsoDate(invoice.dueDate);

  if (String(invoice.status) === "PAID" || amountDue <= 0) return "paid";
  if (amountPaid > 0) return "partial";
  if (dueDate && dueDate < new Date().toISOString().slice(0, 10)) return "overdue";
  return "outstanding";
}

function getInvoiceTotal(invoice: Invoice) {
  const total = Number(invoice.total ?? 0);
  if (total > 0) return Math.round(total * 100) / 100;

  const amountDue = Number(invoice.amountDue ?? 0);
  const amountPaid = Number(invoice.amountPaid ?? 0);
  return Math.round((amountDue + amountPaid) * 100) / 100;
}

async function getXeroIntegration(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", XERO_PROVIDER)
    .maybeSingle<XeroIntegrationRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function fetchAllXeroInvoices(xero: XeroClient, tenantId: string) {
  const invoices: Invoice[] = [];
  let page = 1;

  while (true) {
    const response = await xero.accountingApi.getInvoices(
      tenantId,
      undefined,
      'Type=="ACCREC"',
      "UpdatedDateUTC DESC",
      undefined,
      undefined,
      undefined,
      undefined,
      page,
      false,
      undefined,
      undefined,
      false,
      100,
    );

    invoices.push(...(response.body.invoices ?? []));

    if ((response.body.invoices?.length || 0) < 100) {
      break;
    }
    page += 1;
  }

  return invoices;
}

async function loadExistingXeroCustomers(userId: string, invoiceIds: string[]) {
  if (invoiceIds.length === 0) return new Map<string, ExistingCustomerRow>();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, customer_id, recipient_email, recipient_name, xero_invoice_id, amount_paid, internal_notes")
    .eq("user_id", userId)
    .in("xero_invoice_id", invoiceIds)
    .returns<ExistingCustomerRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((row) => [row.xero_invoice_id ?? "", row]));
}

export async function syncXeroInvoicesForUser(userId: string): Promise<XeroSyncResult> {
  const integration = await getXeroIntegration(userId);
  if (!integration) {
    throw new Error("Xero is not connected.");
  }

  const { xero } = await getValidXeroClient(integration);
  const invoices = await fetchAllXeroInvoices(xero, integration.tenant_id);
  const invoiceIds = invoices
    .map((invoice) => invoice.invoiceID)
    .filter((invoiceId): invoiceId is string => Boolean(invoiceId));
  const existingByInvoiceId = await loadExistingXeroCustomers(userId, invoiceIds);
  const supabase = createSupabaseAdminClient();
  const { data: clientsData } = await supabase.from("clients").select("id, name, email").eq("user_id", userId);
  const clientsMap = new Map<string, { id: string }>();
  for (const client of clientsData || []) {
    if (client.email) clientsMap.set(client.email.toLowerCase(), client);
    if (client.name) clientsMap.set(client.name.toLowerCase(), client);
  }

  const result: XeroSyncResult = {
    imported: 0,
    markedPaid: 0,
    skipped: 0,
    totalInvoices: invoices.length,
    updated: 0,
  };
  const newPaymentLogs: any[] = [];

  for (const invoice of invoices) {
    const invoiceId = invoice.invoiceID;
    if (!invoiceId) {
      result.skipped += 1;
      continue;
    }

    const existing = existingByInvoiceId.get(invoiceId);
    const status = getWorkflowStatus(invoice);
    const isPaid = status === "paid";

    const contactName = invoice.contact?.name?.trim() || "Xero customer";
    const email = normalizeEmail(invoice.contact?.emailAddress) ?? existing?.recipient_email ?? "";
    const amountOwed = getInvoiceTotal(invoice);
    const amountPaid = Math.min(amountOwed, Number(invoice.amountPaid ?? (isPaid ? amountOwed : 0)));
    const existingAmountPaid = existing ? Number(existing.amount_paid || 0) : 0;
    const newlyPaid = amountPaid - existingAmountPaid;
    const internalNotes = invoice.reference ? `Xero Reference: ${invoice.reference}` : null;
    
    // Parse payment date if available, fallback to today
    const paymentDate = toIsoDate(invoice.fullyPaidOnDate) || 
                        toIsoDate(invoice.updatedDateUTC) || 
                        new Date().toISOString().substring(0, 10);
    if (amountOwed <= 0) {
      result.skipped += 1;
      continue;
    }

    const payload = {
      amount_owed: amountOwed,
      amount_paid: isPaid ? amountOwed : amountPaid,
      currency: String(invoice.currencyCode ?? "USD"),
      due_date: toIsoDate(invoice.dueDate),
      recipient_email: email,
      recipient_name: contactName,
      workflow_status: status,
      xero_invoice_id: invoiceId,
      invoice_number: invoice.invoiceNumber || `INV-${invoiceId.substring(0, 8)}`,
      internal_notes: existing?.internal_notes || internalNotes,
    };

    if (existing) {
      const { error } = await supabase
        .from("invoices")
        .update(payload)
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
          invoice_id: existing.id,
          customer_id: existing.customer_id ?? null,
          user_id: userId,
          event_type: "payment",
          event_date: paymentDate,
          amount: newlyPaid,
          currency: payload.currency,
          payment_source: "user",
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
      
      clientRecord = { id: client.id };
      if (email) clientsMap.set(email.toLowerCase(), clientRecord);
      clientsMap.set(contactName.toLowerCase(), clientRecord);
    }

    const { data: newCustomer, error } = await supabase.from("invoices").insert({
      ...payload,
      customer_id: clientRecord.id,
      custom_message: null,
      payment_link: null,
      user_id: userId,
    }).select("id").single();


    if (error) {
      throw new Error(error.message);
    }

    if (newlyPaid > 0 && newCustomer) {
      newPaymentLogs.push({
        invoice_id: newCustomer.id,
        customer_id: clientRecord.id,
        user_id: userId,
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
    const { error: logsError } = await supabase.from("customer_events").insert(newPaymentLogs);
    if (logsError) {
      logger.error({
        message: "Failed to insert payment logs from Xero sync",
        context: "syncXeroInvoicesForUser",
        error: logsError.message,
        user_id: userId,
      });
    }
  }

  const { error: syncError } = await supabase
    .from("integrations")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("provider", XERO_PROVIDER);

  if (syncError) {
    throw new Error(syncError.message);
  }

  logger.external({
    service: "Xero",
    action: "sync_invoices",
    success: true,
    user_id: userId,
  });

  return result;
}

export async function getXeroBankAccounts(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "xero")
    .maybeSingle<XeroIntegrationRow>();

  if (!integration || !integration.tenant_id) return [];

  try {
    const { xero } = await getValidXeroClient(integration);
    const response = await xero.accountingApi.getAccounts(
      integration.tenant_id,
      undefined,
      'Type=="BANK"'
    );
    
    const accounts = response.body.accounts || [];
    return accounts
      .filter(acc => acc.bankAccountNumber)
      .map(acc => ({
        provider: "xero",
        name: acc.name,
        accountNumber: acc.bankAccountNumber,
        currency: acc.currencyCode
      }));
  } catch (error) {
    logger.error({ message: "Failed to fetch Xero bank accounts", context: "xero_bank_sync", original_error: String(error) });
    return [];
  }
}

export async function revokeXeroIntegration(userId: string) {
  const integration = await getXeroIntegration(userId);
  if (!integration) return;

  try {
    const xero = createXeroClient();
    await xero.initialize();
    xero.setTokenSet(storedTokenSet(integration));
    if (tokenNeedsRefresh(integration.expires_at)) {
      await xero.refreshToken();
    }
    await xero.revokeToken();
  } catch (error) {
    logger.external({
      service: "Xero",
      action: "revoke_token",
      success: false,
      user_id: userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
