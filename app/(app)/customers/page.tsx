import { UserRound, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClientRecord, InvoiceRecord, getRemainingBalance, GroupRecord } from "@/lib/types";
import { GroupsManager } from "./components/groups-manager";
import { CustomerGroupsAssigner } from "./components/customer-groups-assigner";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const groupId = params?.groupId as string | undefined;
  
  await requireUser();
  const supabase = await createSupabaseServerClient();

  // Fetch clients
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true })
    .returns<ClientRecord[]>();

  // Fetch invoices to calculate aggregates
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .returns<InvoiceRecord[]>();

  // Fetch groups
  const { data: groupsData } = await supabase
    .from("groups")
    .select("*")
    .order("name", { ascending: true })
    .returns<GroupRecord[]>();

  // Fetch customer groups
  const { data: customerGroupsData } = await supabase
    .from("customer_groups")
    .select("*");

  const { data: payments } = await supabase
    .from("payments")
    .select("*");
    
  const invoicesList = (invoices || []).map((invRaw) => {
    const inv = invRaw;
    const invPayments = (payments || []).filter((p: Record<string, unknown>) => p.invoice_id === inv.id);
    const amount_paid = invPayments.reduce((sum: number, p: Record<string, unknown>) => sum + Number(p.amount || 0), 0);
    return {
      ...inv,
      amount_owed: inv.amount,
      amount_paid,
      workflow_status: inv.status,
      customer_id: inv.client_id
    };
  }) as Record<string, unknown>[];

  const groupsList = groupsData || [];
  const customerGroupsList = customerGroupsData || [];

  let clientsList = clients || [];
  if (groupId) {
    const groupCustomerIds = customerGroupsList
      .filter((cg) => cg.group_id === groupId)
      .map((cg) => cg.customer_id);
    clientsList = clientsList.filter((c) => groupCustomerIds.includes(c.id));
  }

  const clientsWithData = clientsList.map((client) => {
    const clientInvoices = invoicesList.filter(i => i.client_id === client.id || i.customer_id === client.id);
    
    const totalOwed = clientInvoices.reduce((sum, inv) => {
      if (inv.workflow_status === "paid" || inv.workflow_status === "written_off") return sum;
      return sum + getRemainingBalance(inv as unknown as import("@/lib/types").CustomerRecord);
    }, 0);

    const currency = (clientInvoices[0]?.currency as string) || "USD";

    return {
      ...client,
      clientInvoices,
      totalOwed,
      currency
    };
  }).sort((a, b) => b.totalOwed - a.totalOwed);

  const activeGroup = groupId ? groupsList.find((g) => g.id === groupId) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {activeGroup && (
                <div className="mb-2">
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border border-zinc-800 bg-zinc-900/50 text-zinc-300">
                    <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: activeGroup.color || "#3b82f6" }} />
                    {activeGroup.name}
                  </span>
                </div>
              )}
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                Customers
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
                View all your customers and their aggregated balances across all invoices.
              </p>
            </div>
            <div className="flex shrink-0 flex-col sm:flex-row gap-3 sm:items-end">
              <GroupsManager groups={groupsList} />
              <Link href="/customers/new">
                <Button className="w-full sm:w-auto gap-2">
                  <UserRound className="h-4 w-4" />
                  Add customer
                </Button>
              </Link>
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
                {clientsWithData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                      No customers found. Sync from Xero/Quickbooks or add one manually.
                    </td>
                  </tr>
                ) : (
                  clientsWithData.map(({ id, name, email, clientInvoices, totalOwed, currency }) => {
                    const formattedTotal = new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency
                    }).format(totalOwed);

                    const assignedGroupIds = customerGroupsList
                      .filter((cg: Record<string, unknown>) => cg.customer_id === id)
                      .map((cg: Record<string, unknown>) => cg.group_id as string);

                    return (
                      <tr key={id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-4 align-top">
                          <div className="font-medium text-zinc-200 mb-1.5">{name}</div>
                          <CustomerGroupsAssigner 
                            customerId={id} 
                            allGroups={groupsList} 
                            assignedGroupIds={assignedGroupIds} 
                          />
                        </td>
                        <td className="px-4 py-4 align-top">{email || "—"}</td>
                        <td className="px-4 py-4 text-right align-top font-medium text-zinc-200">{formattedTotal}</td>
                        <td className="px-4 py-4 text-right align-top">{clientInvoices.length}</td>
                        <td className="px-4 py-4 text-right align-top">
                          <Link href={`/customers/${id}`}>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-zinc-400 hover:text-zinc-100">
                              View <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
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
