import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClientRecord, InvoiceRecord } from "@/lib/types";

export default async function CustomerProfilePage(props: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await props.params;
  const supabase = await createSupabaseServerClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<ClientRecord>();

  if (!client) {
    notFound();
  }

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("customer_id", id)
    .returns<InvoiceRecord[]>();

  const invoicesList = invoices || [];

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-8">
            <Button variant="ghost" size="sm" className="mb-4 -ml-3 text-zinc-400 hover:text-zinc-100">
              <Link href="/customers" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to customers
              </Link>
            </Button>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50">{client.name}</h1>
            {client.email && <p className="mt-2 text-zinc-400">{client.email}</p>}
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
            <h2 className="text-xl font-medium text-zinc-100 mb-4">Invoices</h2>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-white/[0.02] border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 font-medium text-zinc-300">Invoice #</th>
                    <th className="px-4 py-3 font-medium text-zinc-300">Status</th>
                    <th className="px-4 py-3 font-medium text-zinc-300 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {invoicesList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-zinc-500">No invoices attached to this customer.</td>
                    </tr>
                  ) : (
                    invoicesList.map(inv => (
                      <tr key={inv.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-medium text-zinc-200">{inv.invoice_number || inv.id.substring(0,8)}</td>
                        <td className="px-4 py-3 capitalize">{inv.workflow_status.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-right text-zinc-200">
                          {new Intl.NumberFormat(undefined, { style: "currency", currency: inv.currency || "USD" }).format(inv.amount_owed)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
