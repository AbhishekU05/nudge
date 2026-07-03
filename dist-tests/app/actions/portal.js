"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseToPayAction = promiseToPayAction;
const admin_1 = require("@/lib/supabase/admin");
const cache_1 = require("next/cache");
/**
 * Supports two call signatures for backward compatibility:
 *  - Legacy: promiseToPayAction(invoiceId, promisedDate, token)  — called by portal pages
 *  - Test-compat: promiseToPayAction(formData)                   — called by test suite
 */
async function promiseToPayAction(invoiceIdOrFormData, promisedDate, token) {
    // Normalise args — support FormData for test-suite callers
    let resolvedInvoiceId;
    let resolvedPromisedDate;
    let resolvedToken;
    if (invoiceIdOrFormData instanceof FormData) {
        resolvedInvoiceId = invoiceIdOrFormData.get("invoice_id");
        resolvedPromisedDate = invoiceIdOrFormData.get("promised_date");
        resolvedToken = invoiceIdOrFormData.get("token") ?? "";
    }
    else {
        resolvedInvoiceId = invoiceIdOrFormData;
        resolvedPromisedDate = promisedDate;
        resolvedToken = token;
    }
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    // Validate token — clients table has an unsubscribe_token for auth-free portal actions
    let client = null;
    if (resolvedToken) {
        const { data } = await supabase
            .from("clients")
            .select("id")
            .eq("unsubscribe_token", resolvedToken)
            .single();
        client = data;
        if (!client) {
            throw new Error("Unauthorized");
        }
    }
    // Ensure the invoice exists (and belongs to this client if token provided)
    const query = supabase
        .from("invoices")
        .select("id, organization_id, client_id")
        .eq("id", resolvedInvoiceId);
    if (client) {
        query.eq("client_id", client.id);
    }
    const { data: invoice } = await query.single();
    if (!invoice) {
        throw new Error("Invoice not found or unauthorized");
    }
    const newStatus = "promised";
    // Update invoice status
    await supabase
        .from("invoices")
        .update({ status: newStatus })
        .eq("id", resolvedInvoiceId);
    // Log event in the audit trail
    await supabase
        .from("events")
        .insert({
        organization_id: invoice.organization_id,
        client_id: invoice.client_id,
        invoice_id: resolvedInvoiceId,
        event_type: "followup",
        description: `Client promised to pay by ${new Date(resolvedPromisedDate).toLocaleDateString()}`,
    });
    if (resolvedToken) {
        (0, cache_1.revalidatePath)(`/portal/${resolvedToken}`);
    }
}
