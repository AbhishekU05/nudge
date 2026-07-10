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

  // Fetch unique currencies for the selector — lightweight, just 1 column
  const { data: currencyRows } = await supabase
    .from("invoices")
    .select("currency")
    .not("currency", "is", null);

  const uniqueCurrencies = Array.from(
    new Set((currencyRows || []).map((r: any) => r.currency || "USD"))
  ).sort() as string[];

  if (!uniqueCurrencies.includes("USD")) uniqueCurrencies.unshift("USD");

  const selectedCurrency =
    searchParams?.currency ||
    (uniqueCurrencies.includes("USD") ? "USD" : uniqueCurrencies[0] || "USD");

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
