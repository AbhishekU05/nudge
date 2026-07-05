import re
import os

with open("lib/xero.ts", "r") as f:
    content = f.read()

# Remove fetchAllXeroInvoices and fetchAllXeroPayments
content = re.sub(r'async function fetchAllXeroInvoices.*?return invoices;\n}', '', content, flags=re.DOTALL)
content = re.sub(r'async function fetchAllXeroPayments.*?return payments;\n}', '', content, flags=re.DOTALL)

# Replace syncXeroInvoicesForOrg with syncXeroDataPageForOrg
new_sync_func = """
export async function syncXeroDataPageForOrg(
  organizationId: string, 
  syncType: "invoices" | "payments", 
  page: number
): Promise<{ hasMore: boolean; imported: number; updated: number; nextType?: "invoices" | "payments"; nextPage: number }> {
  const integration = await getXeroIntegration(organizationId);
  if (!integration) throw new Error("Xero is not connected.");
  if (integration.tenant_id === "PENDING_SELECTION") throw new Error("Please select a Xero tenant first.");

  const { xero } = await getValidXeroClient(integration);
  const supabase = createSupabaseAdminClient();
  const result = { hasMore: false, imported: 0, updated: 0, nextType: syncType, nextPage: page + 1 };

  if (syncType === "invoices") {
    const response = await xero.accountingApi.getInvoices(integration.tenant_id, undefined, 'Type=="ACCREC"', "UpdatedDateUTC DESC", undefined, undefined, undefined, undefined, page, false, undefined, undefined, false, 100);
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
        updated_at: new Date().toISOString()
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
    const response = await xero.accountingApi.getPayments(integration.tenant_id, undefined, 'Status=="AUTHORISED"', "UpdatedDateUTC DESC", page);
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
      if (existingPaymentIds.has(p.paymentID)) continue;
      const duelyInvoiceId = xeroIdToDuelyId.get(p.invoice?.invoiceID);
      if (!duelyInvoiceId) continue;
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
      await supabase.from("payments").insert(newPayments);
      result.imported += newPayments.length;
    }
    
    if (!result.hasMore) {
      await supabase.from("integrations").update({ last_synced_at: new Date().toISOString() }).eq("organization_id", organizationId).eq("provider", XERO_PROVIDER);
    }
    
    return result;
  }
  
  return result;
}
"""

content = re.sub(r'export async function syncXeroInvoicesForOrg.*?return result;\n}', new_sync_func, content, flags=re.DOTALL)

with open("lib/xero.ts", "w") as f:
    f.write(content)
