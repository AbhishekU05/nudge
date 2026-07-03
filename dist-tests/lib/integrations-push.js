"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushPaymentToXero = pushPaymentToXero;
exports.pushPaymentToQuickBooks = pushPaymentToQuickBooks;
const xero_node_1 = require("xero-node");
const admin_1 = require("@/lib/supabase/admin");
const logger_1 = require("@/lib/logger");
async function pushPaymentToXero(organizationId, invoiceId, amount, dateIso) {
    try {
        const supabase = (0, admin_1.createSupabaseAdminClient)();
        const { data: integration } = await supabase
            .from("integrations")
            .select("*")
            .eq("organization_id", organizationId)
            .eq("provider", "xero")
            .maybeSingle();
        if (!integration)
            return;
        const xero = new xero_node_1.XeroClient();
        xero.setTokenSet({
            access_token: integration.access_token,
            refresh_token: integration.refresh_token,
            expires_at: Math.floor(new Date(integration.expires_at).getTime() / 1000),
        });
        if (new Date(integration.expires_at).getTime() - Date.now() <= 5 * 60 * 1000) {
            await xero.refreshToken();
        }
        const bankAccountId = integration.bank_account_id;
        if (!bankAccountId) {
            logger_1.logger.error({
                message: "No bank account configured for Xero dual sync",
                context: "pushPaymentToXero",
                organization_id: organizationId,
            });
            return;
        }
        await xero.accountingApi.createPayment(integration.tenant_id, {
            invoice: { invoiceID: invoiceId },
            account: { accountID: bankAccountId },
            amount: amount,
            date: dateIso,
        });
        logger_1.logger.external({
            service: "Xero",
            action: "push_payment",
            success: true,
            organization_id: organizationId,
        });
    }
    catch (error) {
        logger_1.logger.external({
            service: "Xero",
            action: "push_payment",
            success: false,
            organization_id: organizationId,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
async function pushPaymentToQuickBooks(organizationId, invoiceId, amount, dateIso) {
    try {
        const supabase = (0, admin_1.createSupabaseAdminClient)();
        const { data: integration } = await supabase
            .from("integrations")
            .select("*")
            .eq("organization_id", organizationId)
            .eq("provider", "quickbooks")
            .maybeSingle();
        if (!integration || !integration.realm_id)
            return;
        const invoiceUrl = new URL(`https://${integration.realm_id.includes('sandbox') ? 'sandbox-quickbooks' : 'quickbooks'}.api.intuit.com/v3/company/${integration.realm_id}/invoice/${invoiceId}?minorversion=65`);
        const invoiceRes = await fetch(invoiceUrl.toString(), {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${integration.access_token}`,
            },
        });
        if (!invoiceRes.ok)
            return;
        const invoiceData = await invoiceRes.json();
        const customerRef = invoiceData.Invoice?.CustomerRef?.value;
        if (!customerRef)
            return;
        const paymentUrl = new URL(`https://${integration.realm_id.includes('sandbox') ? 'sandbox-quickbooks' : 'quickbooks'}.api.intuit.com/v3/company/${integration.realm_id}/payment?minorversion=65`);
        const paymentPayload = {
            TotalAmt: amount,
            CustomerRef: { value: customerRef },
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
                Authorization: `Bearer ${integration.access_token}`,
            },
            body: JSON.stringify(paymentPayload),
        });
        if (!paymentRes.ok) {
            const errorText = await paymentRes.text();
            throw new Error(`QB Payment Error: ${errorText}`);
        }
        logger_1.logger.external({
            service: "QuickBooks",
            action: "push_payment",
            success: true,
            organization_id: organizationId,
        });
    }
    catch (error) {
        logger_1.logger.external({
            service: "QuickBooks",
            action: "push_payment",
            success: false,
            organization_id: organizationId,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
