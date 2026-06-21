import { Container } from "@/components/site/container";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PipelineClient } from "./pipeline-client";
import { CustomerRecord } from "@/lib/types";

import { CurrencySelector } from "@/components/site/currency-selector";

export default async function PipelinePage(props: {
  searchParams?: Promise<{ currency?: string }>;
}) {
  const searchParams = await props.searchParams;
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching customers for pipeline:", error);
  }

  const allCustomers = (data || []) as CustomerRecord[];
  
  // Handle currencies
  const uniqueCurrencies = Array.from(new Set(allCustomers.map(c => c.currency || 'USD'))).sort();
  const selectedCurrency = searchParams?.currency || (uniqueCurrencies.includes('USD') ? 'USD' : uniqueCurrencies[0] || 'USD');
  const customers = allCustomers.filter(c => (c.currency || 'USD') === selectedCurrency);

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

          <PipelineClient initialCustomers={customers} currency={selectedCurrency} />
        </Container>
      </main>
    </div>
  );
}
