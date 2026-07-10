import { UserRound, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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

  const page = parseInt(params?.page as string || "1", 10);
  const pageSize = 30;

  // Fetch groups for the UI
  const { data: groupsData } = await supabase
    .from("groups")
    .select("*")
    .order("name", { ascending: true })
    .returns<GroupRecord[]>();

  const groupsList = groupsData || [];
  const activeGroup = groupId ? groupsList.find((g) => g.id === groupId) : null;

  // Build the DB query using the new view
  let query = supabase.from("customer_balances").select("*", { count: 'exact' });

  if (groupId) {
    // Filter by group
    const { data: cgData } = await supabase.from("customer_groups").select("customer_id").eq("group_id", groupId);
    const groupCustomerIds = cgData?.map(cg => cg.customer_id) || [];
    if (groupCustomerIds.length > 0) {
      query = query.in("id", groupCustomerIds);
    } else {
      query = query.in("id", []); // empty
    }
  }

  // DB-level Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: clientsData, count } = await query
    .order("total_owed", { ascending: false })
    .range(from, to);

  const displayedClients = clientsData || [];
  const totalCustomers = count || 0;
  const totalPages = Math.ceil(totalCustomers / pageSize);

  // Fetch only the customer groups for the displayed clients
  const displayedClientIds = displayedClients.map(c => c.id);
  const { data: customerGroupsData } = displayedClientIds.length > 0 
    ? await supabase.from("customer_groups").select("*").in("customer_id", displayedClientIds)
    : { data: [] };

  const customerGroupsList = customerGroupsData || [];

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
                  <th className="px-4 py-3 font-medium text-zinc-300 text-right">Total Paid</th>
                  <th className="px-4 py-3 font-medium text-zinc-300 text-right">Total Owed</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {displayedClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500">
                      No customers found. Sync from Xero/Quickbooks or add one manually.
                    </td>
                  </tr>
                ) : (
                  displayedClients.map(({ id, name, totalOwed, totalPaid, currency }) => {
                    const formattedTotal = new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency
                    }).format(totalOwed);

                    const formattedPaid = new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency
                    }).format(totalPaid);

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
                        <td className="px-4 py-4 text-right align-top font-medium text-zinc-200">{formattedPaid}</td>
                        <td className="px-4 py-4 text-right align-top font-medium text-zinc-200">{formattedTotal}</td>
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

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between px-2 text-sm text-zinc-400">
              <div>
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCustomers)} of {totalCustomers} customers
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/customers?page=${page - 1}${groupId ? `&groupId=${groupId}` : ''}`}>
                  <Button variant="secondary" size="sm" disabled={page <= 1} className="h-8 border-white/10 bg-transparent text-zinc-300 hover:bg-white/[0.05]">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                </Link>
                <Link href={`/customers?page=${page + 1}${groupId ? `&groupId=${groupId}` : ''}`}>
                  <Button variant="secondary" size="sm" disabled={page >= totalPages} className="h-8 border-white/10 bg-transparent text-zinc-300 hover:bg-white/[0.05]">
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}
