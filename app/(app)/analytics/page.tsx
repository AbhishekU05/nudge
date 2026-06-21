import { Container } from "@/components/site/container";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnalyticsClient } from "./analytics-client";
import type { CustomerRecord, CustomerEvent } from "@/lib/types";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [customersRes, eventsRes] = await Promise.all([
    supabase.from("customers").select("*").eq("user_id", user.id),
    supabase
      .from("customer_events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  const customers = (customersRes.data || []) as CustomerRecord[];
  const events = (eventsRes.data || []) as CustomerEvent[];

  return (
    <div className="flex min-h-screen flex-col">
      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-8">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
              Analytics
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
              Deep dive into your collection metrics and customer insights.
            </p>
          </div>
          
          <AnalyticsClient customers={customers} events={events} />
        </Container>
      </main>
    </div>
  );
}
