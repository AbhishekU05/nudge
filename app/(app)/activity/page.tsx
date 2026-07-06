import { Container } from "@/components/site/container";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ActivityFeed } from "./activity-feed";

export default async function ActivityPage() {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const [eventsRes, paymentsRes] = await Promise.all([
    supabase
      .from("events")
      .select("*, invoices(clients(name)), clients(name)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("payments")
      .select("*, invoices(clients(name))")
      .order("created_at", { ascending: false })
      .limit(100)
  ]);

  if (eventsRes.error) console.error("Error fetching activity events:", eventsRes.error);
  if (paymentsRes.error) console.error("Error fetching activity payments:", paymentsRes.error);

  const mappedEvents = [
    ...(eventsRes.data || []).map((e: Record<string, string | null | number | undefined | Record<string, unknown>>) => ({
      id: String(e.id),
      invoice_id: String(e.invoice_id),
      customer_id: String(e.invoice_id || e.client_id), 
      user_id: String(e.user_id || ""),
      event_type: String(e.event_type),
      event_date: String(e.created_at),
      created_at: String(e.created_at),
      amount: null,
      currency: null,
      payment_source: null,
      followup_method: null,
      followup_outcome: null,
      note: String(e.description || ""),
      clients: e.clients,
      invoices: e.invoices
    })),
    ...(paymentsRes.data || []).map((p: Record<string, string | null | number | undefined | Record<string, unknown>>) => {
      const inv = p.invoices as { clients?: Record<string, unknown> } | undefined;
      return {
      id: String(p.id),
      invoice_id: String(p.invoice_id),
      customer_id: String(p.invoice_id), 
      user_id: String(p.user_id || ""),
      event_type: "payment",
      event_date: String(p.payment_date || p.created_at),
      created_at: String(p.created_at),
      amount: p.amount,
      currency: p.currency,
      payment_source: p.payment_source || null,
      followup_method: null,
      followup_outcome: null,
      note: null,
      clients: inv?.clients,
      invoices: p.invoices
    }}),
  ].sort((a, b) => new Date(b.event_date || b.created_at).getTime() - new Date(a.event_date || a.created_at).getTime()).slice(0, 100);

  return (
    <div className="flex min-h-screen flex-col">
      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-8">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
              Activity
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
              A complete audit trail of all follow-ups and payments across your customers.
            </p>
          </div>
          
          <ActivityFeed events={mappedEvents || []} />
        </Container>
      </main>
    </div>
  );
}
