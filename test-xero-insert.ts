import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { XeroClient } from 'xero-node';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {} as Record<string, string>);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);

function toIsoDate(value: any) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function getWorkflowStatus(invoice: any) {
  const amountDue = Number(invoice.amountDue ?? 0);
  const amountPaid = Number(invoice.amountPaid ?? 0);
  const dueDate = toIsoDate(invoice.dueDate);
  if (String(invoice.status) === "PAID" || amountDue <= 0) return "paid";
  if (amountPaid > 0) return "partial";
  if (dueDate && dueDate < new Date().toISOString().slice(0, 10)) return "overdue";
  return "outstanding";
}

function getInvoiceTotal(invoice: any) {
  const total = Number(invoice.total ?? 0);
  if (total > 0) return Math.round(total * 100) / 100;
  const amountDue = Number(invoice.amountDue ?? 0);
  const amountPaid = Number(invoice.amountPaid ?? 0);
  return Math.round((amountDue + amountPaid) * 100) / 100;
}

async function check() {
  const userId = '859c2442-cf2b-4f15-aa00-683e66dda8f2';
  const { data: users } = await supabase.from('integrations').select('*').eq('provider', 'xero');
  const user = users[0];
  const xero = new XeroClient({
    clientId: env.XERO_CLIENT_ID,
    clientSecret: env.XERO_CLIENT_SECRET,
  });
  xero.setTokenSet({
    access_token: user.access_token,
    refresh_token: user.refresh_token,
  });

  const response1 = await xero.accountingApi.getInvoices(
    user.tenant_id,
    undefined,
    'Type=="ACCREC"',
    "UpdatedDateUTC DESC",
    undefined,
    undefined,
    undefined,
    undefined,
    1,
    false,
    undefined,
    undefined,
    false,
    100
  );
  
  const invoices = response1.body.invoices || [];
  const invoiceIds = invoices.map((inv: any) => inv.invoiceID).filter(Boolean);
  
  const { data: existingInvoices, error: eError } = await supabase
    .from("invoices")
    .select("id, customer_id, recipient_email, recipient_name, xero_invoice_id, amount_paid, internal_notes")
    .eq("user_id", userId)
    .in("xero_invoice_id", invoiceIds);

  const existingByInvoiceId = new Map((existingInvoices || []).map((row) => [row.xero_invoice_id, row]));
  
  const { data: clientsData } = await supabase.from("clients").select("id, name, email").eq("user_id", userId);
  const clientsMap = new Map();
  for (const client of clientsData || []) {
    if (client.email) clientsMap.set(client.email.toLowerCase(), client);
    if (client.name) clientsMap.set(client.name.toLowerCase(), client);
  }

  let imported = 0;
  let updated = 0;
  for (const invoice of invoices) {
    const invoiceId = invoice.invoiceID;
    const existing = existingByInvoiceId.get(invoiceId);
    
    const status = getWorkflowStatus(invoice);
    const isPaid = status === "paid";
    const contactName = invoice.contact?.name?.trim() || "Xero customer";
    const email = (invoice.contact?.emailAddress?.trim().toLowerCase()) ?? existing?.recipient_email ?? "";
    const amountOwed = getInvoiceTotal(invoice);
    const amountPaid = Math.min(amountOwed, Number(invoice.amountPaid ?? (isPaid ? amountOwed : 0)));
    
    if (amountOwed <= 0) continue;

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
    };

    if (existing) {
      const { error } = await supabase.from("invoices").update(payload).eq("id", existing.id).eq("user_id", userId);
      if (error) console.error("Update error for", invoiceId, error);
      else updated++;
      continue;
    }

    let clientRecord = email ? clientsMap.get(email.toLowerCase()) : undefined;
    if (!clientRecord) clientRecord = clientsMap.get(contactName.toLowerCase());

    if (!clientRecord) {
      const { data: client, error: clientError } = await supabase.from("clients").insert({ user_id: userId, name: contactName, email: email, next_send_at: new Date().toISOString() }).select("id").single();
      if (clientError) {
        console.error("Client insert error", clientError);
        continue;
      }
      clientRecord = client;
      if (email) clientsMap.set(email.toLowerCase(), clientRecord);
      clientsMap.set(contactName.toLowerCase(), clientRecord);
    }

    const { data: newCustomer, error } = await supabase.from("invoices").insert({
      ...payload,
      customer_id: clientRecord.id,
      user_id: userId,
    }).select("id").single();

    if (error) {
      console.error("Invoice insert error", error);
    } else {
      imported++;
    }
  }
  console.log(`Imported ${imported}, Updated ${updated}, Total ${invoices.length}`);
}
check().catch(console.error);
