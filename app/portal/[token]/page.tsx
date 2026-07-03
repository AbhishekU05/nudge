import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

  // Resolve client from unsubscribe_token (safe, non-guessable)
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, email, organization_id")
    .eq("unsubscribe_token", token)
    .single();

  if (clientError || !client) return notFound();

  // Fetch invoices for this client
  const { data: rawInvoices } = await supabase
    .from("invoices")
    .select("id, amount, currency, due_date, status, payment_link, invoice_number, created_at")
    .eq("client_id", client.id)
    .order("due_date", { ascending: true });

  if (!rawInvoices) return notFound();

  // Fetch all payments for these invoices to compute amount_paid per invoice
  const invoiceIds = rawInvoices.map((i) => i.id);
  const { data: payments } = invoiceIds.length
    ? await supabase
        .from("payments")
        .select("invoice_id, amount")
        .in("invoice_id", invoiceIds)
    : { data: [] };

  // Map invoices with computed amount_paid
  const invoices = rawInvoices.map((inv) => {
    const invPayments = (payments || []).filter((p) => p.invoice_id === inv.id);
    const amount_paid = invPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const amount_owed = Number(inv.amount);
    const balance = Math.max(0, amount_owed - amount_paid);
    const isPaid = inv.status === "paid" || balance <= 0;
    return {
      ...inv,
      amount_owed,
      amount_paid,
      balance,
      isPaid,
    };
  });

  // Fetch agency name
  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", client.organization_id)
    .single();

  const agencyName = organization?.name || "Your Agency";

  // Dynamically fetch bank accounts — no data stored in Duely
  const [xeroBanks, qbBanks] = await Promise.all([
    getXeroBankAccounts(client.organization_id),
    getQuickBooksBankAccounts(client.organization_id),
  ]);
  const bankAccounts = [...(xeroBanks || []), ...(qbBanks || [])];

  // Group by currency, then by urgency within each currency
  const currencyMap = new Map<string, {
    outstanding: any[];
    overdue: any[];
    dueSoon: any[];
    paid: any[];
    totalOutstanding: number;
  }>();

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (const inv of invoices) {
    const ccy = inv.currency || "USD";
    if (!currencyMap.has(ccy)) {
      currencyMap.set(ccy, { outstanding: [], overdue: [], dueSoon: [], paid: [], totalOutstanding: 0 });
    }
    const group = currencyMap.get(ccy)!;

    if (inv.isPaid) {
      group.paid.push(inv);
    } else {
      group.totalOutstanding += inv.balance;

      if (inv.due_date) {
        const [yr, mo, dy] = (inv.due_date as string).split("-").map(Number);
        const due = new Date(yr, mo - 1, dy);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          group.overdue.push({ ...inv, daysOverdue: Math.abs(diffDays) });
        } else if (diffDays <= 14) {
          group.dueSoon.push({ ...inv, daysUntilDue: diffDays });
        } else {
          group.outstanding.push(inv);
        }
      } else {
        group.outstanding.push(inv);
      }
    }
  }

  // Deterministic currency order: currencies with overdue first, then due soon, etc.
  const sortedCurrencies = Array.from(currencyMap.entries()).sort(([, a], [, b]) => {
    if (a.overdue.length && !b.overdue.length) return -1;
    if (!a.overdue.length && b.overdue.length) return 1;
    return b.totalOutstanding - a.totalOutstanding;
  });

  return (
    <ClientPortalView
      client={client}
      agencyName={agencyName}
      bankAccounts={bankAccounts}
      currencyGroups={sortedCurrencies}
      token={token}
    />
  );
}
