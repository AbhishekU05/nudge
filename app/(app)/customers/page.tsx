import { UserRound, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GroupRecord } from "@/lib/types";
import { GroupsManager } from "./components/groups-manager";
import { CurrencySelector } from "@/components/site/currency-selector";
import { CustomersTable } from "./customers-table";
import { CustomerSearchInput } from "./customer-search-input";

// The real security boundary: Supabase's query builder parameterizes values
// rather than concatenating raw SQL, so classic SQL injection isn't possible
// via .ilike()/.or() here regardless of input. This sanitizer instead guards
// the adjacent risk that's actually relevant to this query mechanism — a
// user's input altering the .or() filter expression itself (`,` `(` `)` are
// PostgREST filter-grammar syntax) or hijacking the LIKE wildcard (`%` `_`)
// to match more than intended. Applied server-side regardless of what the
// client sends; the client-side version in CustomerSearchInput is UX only.
function sanitizeSearchTerm(raw: string): string {
  return raw.trim().slice(0, 100).replace(/[%_,()]/g, "");
}

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

  // Search — sanitized server-side regardless of what the client sends.
  const rawSearch = (params?.q as string | undefined) || "";
  const searchTerm = sanitizeSearchTerm(rawSearch);

  // Builds a /customers URL carrying every param that should survive
  // navigation (page, currency, group, sort, search), overridden by whatever's passed.
  function buildUrl(overrides: Partial<Record<"page" | "currency" | "groupId" | "sort" | "dir" | "q", string>>) {
    const next = new URLSearchParams();
    const merged = {
      page: String(page),
      currency: selectedCurrency,
      groupId: groupId,
      sort: sortBy,
      dir: sortDir,
      q: searchTerm,
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

  if (searchTerm) {
    clientQuery = clientQuery.or(
      `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`
    );
  }

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

  // Precomputed here (not in the client component) because functions like
  // buildUrl can't cross the server → client boundary — only plain data can.
  const sortHrefs = {
    name: buildUrl({ sort: "name", dir: sortBy === "name" && sortDir === "asc" ? "desc" : "asc", page: "1" }),
    total_paid: buildUrl({ sort: "total_paid", dir: sortBy === "total_paid" && sortDir === "asc" ? "desc" : "asc", page: "1" }),
    total_owed: buildUrl({ sort: "total_owed", dir: sortBy === "total_owed" && sortDir === "asc" ? "desc" : "asc", page: "1" }),
  };

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

          <div className="mb-4">
            <CustomerSearchInput defaultValue={searchTerm} />
          </div>

          <CustomersTable
            clients={displayedClients}
            customerGroupsList={customerGroupsList}
            groupsList={groupsList}
            sortBy={sortBy}
            sortDir={sortDir}
            sortHrefs={sortHrefs}
          />

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
