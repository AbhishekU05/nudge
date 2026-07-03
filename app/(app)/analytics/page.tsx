import { Container } from "@/components/site/container";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnalyticsClient } from "./analytics-client";
import type { CustomerRecord, CustomerEvent } from "@/lib/types";

import { CurrencySelector } from "@/components/site/currency-selector";

export default async function AnalyticsPage(props: {
  searchParams?: Promise<{ currency?: string }>;
}) {
  const searchParams = await props.searchParams;
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [customersRes, eventsRes] = await Promise.all([
    supabase.from("invoices").select("*"),
    supabase
      .from("customer_events")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);

  const allCustomers = (customersRes.data || []) as CustomerRecord[];
  
  // Handle currencies
  const uniqueCurrencies = Array.from(new Set(allCustomers.map(c => c.currency || 'USD'))).sort();
  const selectedCurrency = searchParams?.currency || (uniqueCurrencies.includes('USD') ? 'USD' : uniqueCurrencies[0] || 'USD');
  const customers = allCustomers.filter(c => (c.currency || 'USD') === selectedCurrency);

  const customerIds = new Set(customers.map(c => c.id));
  const events = ((eventsRes.data || []) as CustomerEvent[]).filter(e => e.customer_id && customerIds.has(e.customer_id));

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
          
          <AnalyticsClient customers={customers} events={events} currency={selectedCurrency} />
        </Container>
      </main>
    </div>
  );
}
