import { Container } from "@/components/site/container";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PipelineClient } from "./pipeline-client";
import { CustomerRecord } from "@/lib/types";

import { CurrencySelector } from "@/components/site/currency-selector";

interface PipelineBucket {
  rows: CustomerRecord[];
  count: number;
  total: number;
}
interface PipelineSnapshot {
  outstanding?: PipelineBucket;
  overdue?: PipelineBucket;
  paid?: PipelineBucket;
}

export default async function PipelinePage(props: {
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

  const { data: rpcData, error } = await supabase.rpc("get_pipeline_snapshot", {
    p_currency: selectedCurrency,
  });

  if (error) console.error("Pipeline RPC error:", error);

  const d = (rpcData || null) as PipelineSnapshot | null;

  const pipelines = {
    outstanding: { rows: (d?.outstanding?.rows || []) as CustomerRecord[], count: d?.outstanding?.count || 0, total: d?.outstanding?.total || 0 },
    overdue:     { rows: (d?.overdue?.rows     || []) as CustomerRecord[], count: d?.overdue?.count     || 0, total: d?.overdue?.total     || 0 },
    paid:        { rows: (d?.paid?.rows        || []) as CustomerRecord[], count: d?.paid?.count        || 0, total: d?.paid?.total        || 0 },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10 max-w-[1600px]">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                Collections Pipeline
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
                View your clients across stages to track your recovery process.
              </p>
            </div>
            <CurrencySelector currencies={uniqueCurrencies} selected={selectedCurrency} />
          </div>


          <PipelineClient pipelines={pipelines} currency={selectedCurrency} />
        </Container>
      </main>
    </div>
  );
}
