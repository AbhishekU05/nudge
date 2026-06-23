import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDaysOverdue } from "@/lib/types";
import Link from "next/link";
import { InvoiceCard } from "@/components/portal/invoice-card";
import { getXeroBankAccounts } from "@/lib/xero";
import { getQuickBooksBankAccounts } from "@/lib/quickbooks";


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
    .select("id, name, user_id")
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
    .eq("customer_id", client.id)
    .order("due_date", { ascending: true });

  if (invoicesError || !invoices) {
    console.error("Invoices fetch error:", invoicesError);
    return notFound();
  }

  // Fetch agency name (user profile)
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("company_name, first_name, last_name")
    .eq("id", client.user_id)
    .single();

  const agencyName = userProfile?.company_name || 
    (userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name || ""}` : "Your Agency");

  // Dynamically fetch bank accounts from connected integrations
  const [xeroBanks, qbBanks] = await Promise.all([
    getXeroBankAccounts(client.user_id),
    getQuickBooksBankAccounts(client.user_id)
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-20 flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium uppercase tracking-wider">
            Client Portal &bull; {agencyName}
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {client.name}
          </h1>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-2 shadow-sm">
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Total Amount Outstanding</p>
          <p className="text-4xl sm:text-5xl font-bold tracking-tight">
            {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(totalOutstanding)}
          </p>
        </div>

        {/* Dynamic Bank Accounts */}
        {bankAccounts.length > 0 && (
          <div className="flex flex-col gap-4 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">How to Pay</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {bankAccounts.map((bank, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1 shadow-sm">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{bank.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">{bank.accountNumber}</p>
                  {bank.currency && (
                    <span className="text-xs uppercase font-semibold tracking-wider text-zinc-400 mt-1">
                      {bank.currency}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoice Sections */}
        {outstandingInvoices.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">You have no outstanding invoices.</p>
        ) : (
          <div className="flex flex-col gap-10">
            {overdueInvoices.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  Overdue
                </h2>
                <div className="flex flex-col gap-4">
                  {overdueInvoices.map((inv) => (
                    <InvoiceCard key={inv.id} invoice={inv} token={token} type="overdue" />
                  ))}
                </div>
              </div>
            )}

            {dueSoonInvoices.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-amber-600 dark:text-amber-500 flex items-center gap-2">
                  Due Soon
                </h2>
                <div className="flex flex-col gap-4">
                  {dueSoonInvoices.map((inv) => (
                    <InvoiceCard key={inv.id} invoice={inv} token={token} type="due_soon" />
                  ))}
                </div>
              </div>
            )}

            {otherOutstandingInvoices.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  Outstanding
                </h2>
                <div className="flex flex-col gap-4">
                  {otherOutstandingInvoices.map((inv) => (
                    <InvoiceCard key={inv.id} invoice={inv} token={token} type="outstanding" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paid Invoices */}
        {paidInvoices.length > 0 && (
          <div className="flex flex-col gap-4 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Paid History</h2>
            <div className="flex flex-col gap-4">
              {paidInvoices.map((inv) => (
                <div className="opacity-70 grayscale transition-all hover:grayscale-0 hover:opacity-100" key={inv.id}>
                  <InvoiceCard invoice={inv} token={token} type="paid" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-zinc-400 dark:text-zinc-500 text-sm">
        <p>
          Powered by{" "}
          <Link href="https://duely.in" target="_blank" className="font-medium hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">
            Duely
          </Link>
        </p>
      </footer>
    </div>
  );
}
