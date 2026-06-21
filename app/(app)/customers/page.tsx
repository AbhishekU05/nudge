import { UserRound, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClientRecord, InvoiceRecord, getRemainingBalance } from "@/lib/types";

export default async function CustomersPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Fetch clients
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true })
    .returns<ClientRecord[]>();

  // Fetch invoices to calculate aggregates
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", user.id)
    .returns<InvoiceRecord[]>();

  const clientsList = clients || [];
  const invoicesList = invoices || [];

  return (
    <div className="flex min-h-screen flex-col">
      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                Customers
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
                View all your customers and their aggregated balances across all invoices.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:items-end">
              <Button disabled className="w-full sm:w-auto gap-2">
                <UserRound className="h-4 w-4" />
                Add customer (Coming soon)
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-white/[0.02] border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-300">Name</th>
                  <th className="px-4 py-3 font-medium text-zinc-300">Email</th>
                  <th className="px-4 py-3 font-medium text-zinc-300 text-right">Total Owed</th>
                  <th className="px-4 py-3 font-medium text-zinc-300 text-right">Total Invoices</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {clientsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                      No customers found. Sync from Xero/Quickbooks or add one manually.
                    </td>
                  </tr>
                ) : (
                  clientsList.map((client) => {
                    const clientInvoices = invoicesList.filter(i => i.customer_id === client.id || (i.recipient_name === client.name));
                    
                    const totalOwed = clientInvoices.reduce((sum, inv) => {
                      if (inv.workflow_status === "paid" || inv.workflow_status === "written_off") return sum;
                      return sum + getRemainingBalance(inv);
                    }, 0);

                    // Grab currency from the first invoice, default to USD
                    const currency = clientInvoices[0]?.currency || "USD";
                    
                    const formattedTotal = new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency
                    }).format(totalOwed);

                    return (
                      <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-4 font-medium text-zinc-200">{client.name}</td>
                        <td className="px-4 py-4">{client.email || "—"}</td>
                        <td className="px-4 py-4 text-right font-medium text-zinc-200">{formattedTotal}</td>
                        <td className="px-4 py-4 text-right">{clientInvoices.length}</td>
                        <td className="px-4 py-4 text-right">
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-zinc-400 hover:text-zinc-100" asChild>
                            <Link href={`/customers/${client.id}`}>
                              View <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Container>
      </main>
    </div>
  );
}
