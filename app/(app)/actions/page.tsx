import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/site/container";
import { generateActionPlan } from "@/lib/action-engine";
import { ClientRecord, InvoiceRecord, getDaysOverdue, getRemainingBalance, FollowUpLog } from "@/lib/types";

import { ActionsUI } from "./actions-ui";

export default async function ActionsPage() {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const [clientsRes, invoicesRes, eventsRes] = await Promise.all([
    supabase.from("clients").select("*"),
    supabase.from("invoices").select("*"),
    supabase.from("events").select("*").eq("event_type", "followup"),
  ]);

  const clients = (clientsRes.data || []) as ClientRecord[];
  const allInvoices = (invoicesRes.data || []) as InvoiceRecord[];
  const events = (eventsRes.data || []);

  // Attach follow-up history to invoices manually so the engine can check cooldowns
  for (const inv of allInvoices) {
    if (!inv.followup_history) {
      inv.followup_history = [];
    }
    const invEvents = events.filter((e: { invoice_id?: string; [key: string]: unknown }) => e.invoice_id === inv.id);
    for (const e of invEvents) {
      inv.followup_history.push({
        ...(e as unknown as FollowUpLog),
        followup_date: (e as unknown as { event_date?: string; created_at: string }).event_date || (e as unknown as { event_date?: string; created_at: string }).created_at
      });
    }
  }

  const tasks = generateActionPlan(clients, allInvoices);

  // Calculate max days overdue for all active invoices
  let maxOverdue = 0;
  for (const inv of allInvoices) {
    if (inv.workflow_status !== "paid" && inv.workflow_status !== "written_off" && getRemainingBalance(inv) > 0) {
      const overdue = getDaysOverdue(inv) || 0;
      if (overdue > maxOverdue) maxOverdue = overdue;
    }
  }
  const isAllUnder3Days = maxOverdue < 3;

  return (
    <div className="flex min-h-screen flex-col">
      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10">
          <ActionsUI tasks={tasks} isAllUnder3Days={isAllUnder3Days} />
        </Container>
      </main>
    </div>
  );
}
