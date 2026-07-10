import { Container } from "@/components/site/container";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnalyticsClient } from "./analytics-client";

import { CurrencySelector } from "@/components/site/currency-selector";

export default async function AnalyticsPage(props: {
  searchParams?: Promise<{ currency?: string }>;
}) {
  const searchParams = await props.searchParams;
  await requireUser();
  const supabase = await createSupabaseServerClient();

  // Distinct currencies (RLS-scoped, aggregated in Postgres) drive the selector
  // and the default: USD if the org has USD invoices, otherwise its first currency.
  const { data: currencyData } = await supabase.rpc("get_invoice_currencies");
  const orgCurrencies = (currencyData as string[] | null) || [];
  const uniqueCurrencies = Array.from(new Set([...orgCurrencies, "USD"])).sort();
  const defaultCurrency = orgCurrencies.includes("USD") ? "USD" : orgCurrencies[0] || "USD";
  const selectedCurrency = searchParams?.currency || defaultCurrency;

  // Single RPC call — all heavy aggregation done in Postgres
  const { data: analyticsData, error } = await supabase.rpc(
    "get_collection_analytics",
    { p_currency: selectedCurrency }
  );

  if (error) {
    console.error("Analytics RPC error:", error);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                Analytics
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
                Deep dive into your collection metrics and customer insights.
              </p>
            </div>
            <CurrencySelector currencies={uniqueCurrencies} selected={selectedCurrency} />
          </div>
          
          <AnalyticsClient data={analyticsData || null} currency={selectedCurrency} />
        </Container>
      </main>
    </div>
  );
}
