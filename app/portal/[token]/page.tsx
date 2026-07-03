import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDaysOverdue } from "@/lib/types";
import Link from "next/link";
import { InvoiceCard } from "@/components/portal/invoice-card";
import { getXeroBankAccounts } from "@/lib/xero";
import { getQuickBooksBankAccounts } from "@/lib/quickbooks";
import { ClientPortalView } from "@/components/portal/client-portal-view";


export const dynamic = "force-dynamic";

export default async function PortalPage(props: {
  params: Promise<{ token: string }>;
}) {
  const params = await props.params;
  const token = params.token;
  if (!token) return notFound();

  const supabase = createSupabaseAdminClient();

  // Fetch client by unsubscribe_token
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, organization_id")
    .eq("unsubscribe_token", token)
    .single();

  if (clientError || !client) {
    console.error("Portal fetch error:", clientError, "token:", token);
    return notFound();
  }

  // Fetch invoices for this client
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("*")
    .eq("client_id", client.id)
    .order("due_date", { ascending: true });

  if (invoicesError || !invoices) {
    console.error("Invoices fetch error:", invoicesError);
    return notFound();
  }

  // Fetch agency name (organization profile)
  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", client.organization_id)
    .single();

  const agencyName = organization?.name || "Your Agency";

  // Dynamically fetch bank accounts from connected integrations
  const [xeroBanks, qbBanks] = await Promise.all([
    getXeroBankAccounts(client.organization_id),
    getQuickBooksBankAccounts(client.organization_id)
  ]);
  
  const bankAccounts = [...(xeroBanks || []), ...(qbBanks || [])];

  const outstandingInvoices = invoices.filter(
    (inv) => inv.workflow_status !== "paid" && inv.client_paid_at === null
  );
  
  const paidInvoices = invoices.filter(
    (inv) => inv.workflow_status === "paid" || inv.client_paid_at !== null
  );

  const totalOutstanding = outstandingInvoices.reduce(
    (sum, inv) => sum + Math.max(0, Number(inv.amount_owed) - Number(inv.amount_paid)),
    0
  );

  // Group unpaid invoices
  const overdueInvoices: any[] = [];
  const dueSoonInvoices: any[] = [];
  const otherOutstandingInvoices: any[] = [];

  outstandingInvoices.forEach(inv => {
    const overdueDays = inv.due_date ? getDaysOverdue(inv as any) : null;
    if (overdueDays !== null && overdueDays > 0) {
      overdueInvoices.push(inv);
    } else if (inv.due_date) {
      const [year, month, day] = inv.due_date.split("-").map(Number);
      const due = new Date(year, month - 1, day);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 14) {
        dueSoonInvoices.push(inv);
      } else {
        otherOutstandingInvoices.push(inv);
      }
    } else {
      otherOutstandingInvoices.push(inv);
    }
  });

  // Assuming all invoices use the same currency, fallback to USD
  const currency = outstandingInvoices[0]?.currency || paidInvoices[0]?.currency || "USD";

  return (
    <ClientPortalView 
      client={client}
      agencyName={agencyName}
      bankAccounts={bankAccounts}
      totalOutstanding={totalOutstanding}
      overdueInvoices={overdueInvoices}
      dueSoonInvoices={dueSoonInvoices}
      otherOutstandingInvoices={otherOutstandingInvoices}
      paidInvoices={paidInvoices}
      currency={currency}
      token={token}
    />
  );
}
