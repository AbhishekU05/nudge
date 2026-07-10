import { XeroClient } from "xero-node";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { XeroIntegrationRow } from "./xero";
import { QuickBooksIntegrationRow, getApiBaseUrl, getValidQuickBooksTokens } from "./quickbooks";

export async function pushPaymentToXero(
  organizationId: string,
  invoiceId: string,
  amount: number,
  dateIso: string,
  bankAccountId?: string,
  localPaymentId?: string
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: integration } = await supabase
      .from("integrations")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("provider", "xero")
      .maybeSingle<XeroIntegrationRow>();

    if (!integration) return;

    const xero = new XeroClient();
    xero.setTokenSet({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      expires_at: Math.floor(new Date(integration.expires_at).getTime() / 1000),
    });

    if (new Date(integration.expires_at).getTime() - Date.now() <= 5 * 60 * 1000) {
      await xero.refreshToken();
    }

    const finalBankAccountId = bankAccountId || integration.xero_default_account_id;
    if (!finalBankAccountId) {
      logger.error({
        message: "No bank account provided and no default configured for Xero dual sync",
        context: "pushPaymentToXero",
        organization_id: organizationId,
      });
      return;
    }

    const response = await xero.accountingApi.createPayment(integration.tenant_id, {
      invoice: { invoiceID: invoiceId },
      account: { accountID: finalBankAccountId },
      amount: amount,
      date: dateIso,
      reference: "Logged via Duely",
    });

    const xeroPaymentId = response.body.payments?.[0]?.paymentID;
    if (xeroPaymentId && localPaymentId) {
      await supabase.from("payments").update({ reference_id: xeroPaymentId, payment_method: "xero_sync" }).eq("id", localPaymentId);
    }

    logger.external({
      service: "Xero",
      action: "push_payment",
      success: true,
      organization_id: organizationId,
    });
  } catch (error) {
    logger.external({
      service: "Xero",
      action: "push_payment",
      success: false,
      organization_id: organizationId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function pushPaymentToQuickBooks(
  organizationId: string,
  invoiceId: string,
  amount: number,
  dateIso: string,
  bankAccountId?: string,
  localPaymentId?: string
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: integration } = await supabase
      .from("integrations")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("provider", "quickbooks")
      .maybeSingle<QuickBooksIntegrationRow>();

    if (!integration || !integration.realm_id) return;
    
    const validIntegration = await getValidQuickBooksTokens(integration);
    const baseUrl = await getApiBaseUrl();
    
    const invoiceUrl = new URL(`${baseUrl}/v3/company/${integration.realm_id}/invoice/${invoiceId}?minorversion=65`);
    const invoiceRes = await fetch(invoiceUrl.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${validIntegration.access_token}`,
      },
    });

    if (!invoiceRes.ok) return; 
    const invoiceData = await invoiceRes.json();
    const customerRef = invoiceData.Invoice?.CustomerRef?.value;
    if (!customerRef) return;
    
    const finalBankAccountId = bankAccountId || integration.quickbooks_default_account_id;
    if (!finalBankAccountId) {
      logger.error({
        message: "No bank account provided and no default configured for QuickBooks dual sync",
        context: "pushPaymentToQuickBooks",
        organization_id: organizationId,
      });
      return;
    }

    const paymentUrl = new URL(`${baseUrl}/v3/company/${integration.realm_id}/payment?minorversion=65`);
    
    const paymentPayload = {
      TotalAmt: amount,
      CustomerRef: { value: customerRef },
      DepositToAccountRef: { value: finalBankAccountId },
      TxnDate: dateIso,
      Line: [
        {
          Amount: amount,
          LinkedTxn: [{ TxnId: invoiceId, TxnType: "Invoice" }],
        },
      ],
    };

    const paymentRes = await fetch(paymentUrl.toString(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${validIntegration.access_token}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    if (!paymentRes.ok) {
      const errorText = await paymentRes.text();
      throw new Error(`QB Payment Error: ${errorText}`);
    }
    
    const paymentData = await paymentRes.json();
    const qbPaymentId = paymentData.Payment?.Id;

    if (qbPaymentId && localPaymentId) {
      await supabase.from("payments").update({ reference_id: qbPaymentId, payment_method: "quickbooks_sync" }).eq("id", localPaymentId);
    }

    logger.external({
      service: "QuickBooks",
      action: "push_payment",
      success: true,
      organization_id: organizationId,
    });
  } catch (error) {
    logger.external({
      service: "QuickBooks",
      action: "push_payment",
      success: false,
      organization_id: organizationId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function pushDueDateToXero(
  organizationId: string,
  invoiceId: string,
  dueDateIso: string
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: integration } = await supabase
      .from("integrations")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("provider", "xero")
      .maybeSingle<XeroIntegrationRow>();

    if (!integration) return;

    const xero = new XeroClient();
    xero.setTokenSet({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      expires_at: Math.floor(new Date(integration.expires_at).getTime() / 1000),
    });

    if (new Date(integration.expires_at).getTime() - Date.now() <= 5 * 60 * 1000) {
      await xero.refreshToken();
    }

    await xero.accountingApi.updateInvoice(integration.tenant_id, invoiceId, {
      invoices: [{ dueDate: dueDateIso }]
    });

    logger.external({
      service: "Xero",
      action: "push_due_date",
      success: true,
      organization_id: organizationId,
    });
  } catch (error) {
    logger.external({
      service: "Xero",
      action: "push_due_date",
      success: false,
      organization_id: organizationId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function pushDueDateToQuickBooks(
  organizationId: string,
  invoiceId: string,
  dueDateIso: string
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: integration } = await supabase
      .from("integrations")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("provider", "quickbooks")
      .maybeSingle<QuickBooksIntegrationRow>();

    if (!integration || !integration.realm_id) return;
    
    const validIntegration = await getValidQuickBooksTokens(integration);
    const baseUrl = await getApiBaseUrl();
    
    const invoiceUrl = new URL(`${baseUrl}/v3/company/${integration.realm_id}/invoice/${invoiceId}?minorversion=65`);
    const invoiceRes = await fetch(invoiceUrl.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${validIntegration.access_token}`,
      },
    });

    if (!invoiceRes.ok) return; 
    const invoiceData = await invoiceRes.json();
    const syncToken = invoiceData.Invoice?.SyncToken;
    
    if (!syncToken) return;

    const updateUrl = new URL(`${baseUrl}/v3/company/${integration.realm_id}/invoice?minorversion=65`);
    const updatePayload = {
      Id: invoiceId,
      SyncToken: syncToken,
      sparse: true,
      DueDate: dueDateIso,
    };

    const updateRes = await fetch(updateUrl.toString(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${validIntegration.access_token}`,
      },
      body: JSON.stringify(updatePayload),
    });

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      throw new Error(`QB Update Error: ${errorText}`);
    }

    logger.external({
      service: "QuickBooks",
      action: "push_due_date",
      success: true,
      organization_id: organizationId,
    });
  } catch (error) {
    logger.external({
      service: "QuickBooks",
      action: "push_due_date",
      success: false,
      organization_id: organizationId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
