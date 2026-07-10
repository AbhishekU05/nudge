import { UserRound, ArrowRight, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GroupRecord } from "@/lib/types";
import { GroupsManager } from "./components/groups-manager";
import { CustomerGroupsAssigner } from "./components/customer-groups-assigner";
import { CurrencySelector } from "@/components/site/currency-selector";

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

  // Distinct currencies (RLS-scoped, aggregated in Postgres) drive the selector
  // and the default: USD if the org has USD invoices, otherwise its first currency.
  const { data: currencyData } = await supabase.rpc("get_invoice_currencies");
  const orgCurrencies = (currencyData as string[] | null) || [];
  const uniqueCurrencies = Array.from(new Set([...orgCurrencies, "USD"])).sort();
  const defaultCurrency = orgCurrencies.includes("USD") ? "USD" : orgCurrencies[0] || "USD";
  const selectedCurrency = (params?.currency as string | undefined) || defaultCurrency;

  // Sort — validated against an allowlist since it feeds straight into .order().
  const SORTABLE_COLUMNS = ["name", "total_paid", "total_owed"] as const;
  type SortColumn = (typeof SORTABLE_COLUMNS)[number];
  const rawSort = params?.sort as string | undefined;
  const sortBy: SortColumn = (SORTABLE_COLUMNS as readonly string[]).includes(rawSort || "")
    ? (rawSort as SortColumn)
    : "name";
  const sortDir: "asc" | "desc" = params?.dir === "desc" ? "desc" : "asc";

  // Builds a /customers URL carrying every param that should survive
  // navigation (page, currency, group, sort), overridden by whatever's passed.
  function buildUrl(overrides: Partial<Record<"page" | "currency" | "groupId" | "sort" | "dir", string>>) {
    const next = new URLSearchParams();
    const merged = {
      page: String(page),
      currency: selectedCurrency,
      groupId: groupId,
      sort: sortBy,
      dir: sortDir,
      ...overrides,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    return `/customers?${next.toString()}`;
  }

  // Fetch groups for the UI
  const { data: groupsData } = await supabase
    .from("groups")
    .select("*")
    .order("name", { ascending: true })
    .returns<GroupRecord[]>();

  const groupsList = groupsData || [];
  const activeGroup = groupId ? groupsList.find((g) => g.id === groupId) : null;

  // Query the precomputed per-client, per-currency balances view directly —
  // total_owed/total_paid/currency already exist as columns, so filtering,
  // sorting, and pagination can all be expressed as plain query params here
  // instead of side-fetching invoices/payments and reducing in Node.
  let clientQuery = supabase
    .from("customer_balances_by_currency")
    .select("id, name, email, company_name, created_at, organization_id, currency, total_owed, total_paid", { count: "exact" })
    .eq("currency", selectedCurrency)
    .order(sortBy, { ascending: sortDir === "asc" });

  if (groupId) {
    const { data: cgData } = await supabase
      .from("customer_groups")
      .select("customer_id")
      .eq("group_id", groupId);
    const groupCustomerIds = cgData?.map((cg) => cg.customer_id) || [];
    if (groupCustomerIds.length > 0) {
      clientQuery = clientQuery.in("id", groupCustomerIds);
    } else {
      clientQuery = clientQuery.in("id", []);
    }
  }

  // DB-level Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: clientsRaw, count } = await clientQuery.range(from, to);
  const displayedClients = clientsRaw || [];
  const totalCustomers = count || 0;
  const totalPages = Math.ceil(totalCustomers / pageSize);

  const displayedClientIds = displayedClients.map((c) => c.id);

  // Fetch only the customer groups for the displayed clients
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
              <CurrencySelector currencies={uniqueCurrencies} selected={selectedCurrency} />
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
                  <th className="px-4 py-3 font-medium text-zinc-300">
                    <Link href={buildUrl({ sort: "name", dir: sortBy === "name" && sortDir === "asc" ? "desc" : "asc", page: "1" })} className="inline-flex items-center gap-1 hover:text-zinc-100 transition-colors">
                      Name
                      {sortBy === "name" && (sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)}
                    </Link>
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-300 text-right">
                    <Link href={buildUrl({ sort: "total_paid", dir: sortBy === "total_paid" && sortDir === "asc" ? "desc" : "asc", page: "1" })} className="inline-flex items-center gap-1 justify-end hover:text-zinc-100 transition-colors">
                      Total Paid
                      {sortBy === "total_paid" && (sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)}
                    </Link>
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-300 text-right">
                    <Link href={buildUrl({ sort: "total_owed", dir: sortBy === "total_owed" && sortDir === "asc" ? "desc" : "asc", page: "1" })} className="inline-flex items-center gap-1 justify-end hover:text-zinc-100 transition-colors">
                      Total Owed
                      {sortBy === "total_owed" && (sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)}
                    </Link>
                  </th>
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
                  displayedClients.map(({ id, name, total_owed, total_paid, currency }) => {
                    const formattedTotal = new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency
                    }).format(total_owed);

                    const formattedPaid = new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency
                    }).format(total_paid);

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
                <Link href={buildUrl({ page: String(page - 1) })}>
                  <Button variant="secondary" size="sm" disabled={page <= 1} className="h-8 border-white/10 bg-transparent text-zinc-300 hover:bg-white/[0.05]">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                </Link>
                <Link href={buildUrl({ page: String(page + 1) })}>
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
