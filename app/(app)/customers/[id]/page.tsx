import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/container";
import { AutomationSettings } from "@/components/site/automation-settings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClientRecord, InvoiceRecord, getRemainingBalance, GroupRecord } from "@/lib/types";
import { CustomerAnalytics } from "./customer-analytics";

export default async function CustomerProfilePage(props: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await props.params;
  const supabase = await createSupabaseServerClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
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

  // Fetch the assigned group if any
  const { data: customerGroupData } = await supabase
    .from("customer_groups")
    .select("groups(*)")
    .eq("customer_id", id)
    .maybeSingle();
    
  const group = customerGroupData?.groups as unknown as GroupRecord | undefined;

  const { isAutomationAndIntegrationAllowed } = await import("@/lib/payments");
  const { data: org } = await supabase
    .from("organizations")
    .select("dodo_subscription_status, created_at")
    .eq("id", client.organization_id)
    .single();
  const isAllowed = org ? isAutomationAndIntegrationAllowed(org.dodo_subscription_status, org.created_at) : false;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button variant="ghost" size="sm" className="mb-4 -ml-3 text-zinc-400 hover:text-zinc-100">
                <Link href="/customers" className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to customers
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50">{client.name}</h1>
                {group && (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
                    style={{
                      backgroundColor: `${group.color || "#3b82f6"}20`,
                      color: group.color || "#3b82f6",
                      borderColor: `${group.color || "#3b82f6"}40`,
                    }}
                  >
                    {group.name}
                  </span>
                )}
              </div>
              {client.email && <p className="mt-2 text-zinc-400">{client.email}</p>}
            </div>
            
            <Link 
              href={`/portal/${client.unsubscribe_token}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 font-medium tracking-tight transition-colors focus-visible:outline-none h-10 px-4 text-sm bg-white/[0.06] text-zinc-100 hover:bg-white/[0.1] sm:self-end"
            >
              <ExternalLink className="h-4 w-4" />
              View Client Portal
            </Link>
          </div>

          <div className="space-y-12">
            {/* 1. Analytics Section */}
            <section>
              <h2 className="text-xl font-medium text-zinc-100 mb-6">Analytics</h2>
              <CustomerAnalytics invoices={invoicesList} />
            </section>

            {/* 2. Invoices List */}
            <section>
              <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
                <h2 className="text-xl font-medium text-zinc-100 mb-4">Invoices</h2>
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-white/[0.02] border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 font-medium text-zinc-300">Invoice #</th>
                        <th className="px-4 py-3 font-medium text-zinc-300">Status</th>
                        <th className="px-4 py-3 font-medium text-zinc-300">Due Date</th>
                        <th className="px-4 py-3 font-medium text-zinc-300 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {invoicesList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-zinc-500">No invoices attached.</td>
                        </tr>
                      ) : (
                        invoicesList.map(inv => {
                          const remaining = getRemainingBalance(inv);
                          const isPaid = inv.workflow_status === "paid" || remaining === 0;
                          const dueDate = inv.due_date ? new Date(inv.due_date) : null;
                          const isOverdue = !isPaid && dueDate && dueDate < new Date();
                          
                          return (
                            <tr key={inv.id} className="hover:bg-white/[0.02]">
                              <td className="px-4 py-3 font-medium text-zinc-200">
                                <Link href={`/invoices/${inv.id}`} className="hover:underline hover:text-indigo-400">
                                  {inv.invoice_number || inv.id.substring(0,8)}
                                </Link>
                              </td>
                              <td className="px-4 py-3">
                                {isPaid ? (
                                  <Badge variant="success">Paid</Badge>
                                ) : isOverdue ? (
                                  <Badge variant="danger">Overdue</Badge>
                                ) : (
                                  <Badge variant="default">Outstanding</Badge>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {dueDate ? dueDate.toLocaleDateString() : "N/A"}
                              </td>
                              <td className="px-4 py-3 text-right text-zinc-200">
                                {new Intl.NumberFormat(undefined, { style: "currency", currency: inv.currency || "USD" }).format(inv.amount_owed)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 3. Automation Settings */}
            <section>
              <h2 className="text-xl font-medium text-zinc-100 mb-6">Automation Settings</h2>
              <AutomationSettings 
                entityType="client"
                entityId={client.id}
                active={client.active}
                autoApprove={client.auto_approve}
                reminderType={client.reminder_type}
                reminderTemplates={client.reminder_templates || []}
                targetEmail={client.email}
                isAllowed={isAllowed}
              />
            </section>
          </div>
        </Container>
      </main>
    </div>
  );
}
