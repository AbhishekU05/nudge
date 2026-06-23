import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDaysOverdue } from "@/lib/types";
import Link from "next/link";


export const dynamic = "force-dynamic";

export default async function PortalPage({
  params,
}: {
  params: { token: string };
}) {
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
    return notFound();
  }

  // Fetch invoices for this client
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("*")
    .eq("customer_id", client.id)
    .order("due_date", { ascending: true });

  if (invoicesError || !invoices) {
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

        {/* Outstanding Invoices */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Outstanding Invoices</h2>
          {outstandingInvoices.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">You have no outstanding invoices.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {outstandingInvoices.map((inv) => {
                const balance = Math.max(0, Number(inv.amount_owed) - Number(inv.amount_paid));
                const overdueDays = inv.due_date ? getDaysOverdue(inv as any) : null;
                const isOverdue = overdueDays !== null && overdueDays > 0;

                return (
                  <div 
                    key={inv.id} 
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-lg">
                          {inv.invoice_number ? `Invoice ${inv.invoice_number}` : "Invoice"}
                        </h3>
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                            {overdueDays} days overdue
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "No due date"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/2">
                      <p className="text-xl font-semibold">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: inv.currency }).format(balance)}
                      </p>
                      {inv.payment_link && (
                        <a 
                          href={inv.payment_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background h-10 px-4 text-sm bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
                        >
                          Pay Now
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Paid Invoices */}
        {paidInvoices.length > 0 && (
          <div className="flex flex-col gap-4 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Paid History</h2>
            <div className="flex flex-col gap-3">
              {paidInvoices.map((inv) => (
                <div 
                  key={inv.id} 
                  className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl p-4 sm:p-5 flex items-center justify-between opacity-80"
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="font-medium">
                      {inv.invoice_number ? `Invoice ${inv.invoice_number}` : "Invoice"}
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                      Paid: {inv.client_paid_at ? new Date(inv.client_paid_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Recently paid"}
                    </p>
                  </div>
                  <p className="font-medium text-zinc-600 dark:text-zinc-300">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: inv.currency }).format(Number(inv.amount_paid) > 0 ? Number(inv.amount_paid) : Number(inv.amount_owed))}
                  </p>
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
