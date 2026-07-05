import { Container } from "@/components/site/container";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ActivityFeed } from "./activity-feed";

export default async function ActivityPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("*, invoices(clients(name)), clients(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching activity events:", error);
  }

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
          
          <ActivityFeed events={events || []} />
        </Container>
      </main>
    </div>
  );
}
