import { Container } from "@/components/site/container";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ActivityFeed } from "./activity-feed";

export default async function ActivityPage(props: { searchParams?: Promise<{ page?: string }> }) {
  await requireUser();
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page || "1", 10);
  const pageSize = 100;
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = await createSupabaseServerClient();

  // Single ordered source (events + payments unioned in the activity_feed view,
  // RLS-scoped) so pagination returns exactly the right window with no gaps.
  const { data: feedRows, count, error } = await supabase
    .from("activity_feed")
    .select("*", { count: "exact" })
    .order("event_date", { ascending: false })
    .range(from, to);

  if (error) console.error("Error fetching activity feed:", error);

  const mappedEvents = (feedRows || []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    invoice_id: String(r.invoice_id || ""),
    raw_invoice_id: r.invoice_id,
    raw_client_id: r.client_id,
    customer_id: String(r.invoice_id || r.client_id || ""),
    event_type: String(r.event_type),
    event_date: String(r.event_date),
    created_at: String(r.created_at),
    amount: r.amount,
    currency: r.currency,
    payment_source: r.payment_source || null,
    followup_method: null,
    followup_outcome: null,
    note: r.note || null,
    clients: { name: r.client_name },
    invoices: { invoice_number: r.invoice_number },
  }));

  const hasMore = count !== null ? to + 1 < count : (feedRows?.length === pageSize);

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
          
          <ActivityFeed events={mappedEvents || []} page={page} hasMore={hasMore} />
        </Container>
      </main>
    </div>
  );
}
