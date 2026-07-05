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

  const [invoicesRes, eventsRes, paymentsRes] = await Promise.all([
    supabase.from("invoices").select("*, clients(name, email)"),
    supabase.from("events").select("*").order("created_at", { ascending: true }),
    supabase.from("payments").select("*").order("created_at", { ascending: true })
  ]);

  const allCustomers = (invoicesRes.data || []).map((inv: any) => {
    const invPayments = (paymentsRes.data || []).filter((p: any) => p.invoice_id === inv.id);
    const amount_paid = invPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    return {
      ...inv,
      amount_owed: inv.amount,
      amount_paid,
      workflow_status: inv.status
    };
  }) as CustomerRecord[];
  
  // Handle currencies
  const uniqueCurrencies = Array.from(new Set(allCustomers.map(c => c.currency || 'USD'))).sort();
  const selectedCurrency = searchParams?.currency || (uniqueCurrencies.includes('USD') ? 'USD' : uniqueCurrencies[0] || 'USD');
  const customers = allCustomers.filter(c => (c.currency || 'USD') === selectedCurrency);

  const customerIds = new Set(customers.map(c => c.id));
  
  const mappedEvents = [
    ...(eventsRes.data || []).map((e: any) => ({
      id: e.id,
      invoice_id: e.invoice_id,
      customer_id: e.invoice_id, // Analytics maps customer_id to invoice_id under the hood for grouping
      event_type: e.event_type,
      event_date: e.created_at,
      created_at: e.created_at,
      amount: null,
      currency: null
    })),
    ...(paymentsRes.data || []).map((p: any) => ({
      id: p.id,
      invoice_id: p.invoice_id,
      customer_id: p.invoice_id, // Analytics groups by invoice
      event_type: "payment",
      event_date: p.payment_date || p.created_at,
      created_at: p.created_at,
      amount: p.amount,
      currency: p.currency
    }))
  ];

  const events = mappedEvents.filter(e => e.customer_id && customerIds.has(e.customer_id)) as unknown as CustomerEvent[];

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
