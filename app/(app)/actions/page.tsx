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
    // Only invoices that could still need action — paid/written-off invoices
    // are irrelevant to the action plan and would otherwise be downloaded
    // and looped over for nothing.
    supabase.from("invoices").select("*").neq("status", "paid").neq("status", "written_off"),
    supabase.from("events").select("*").eq("event_type", "followup"),
  ]);

  const clients = (clientsRes.data || []) as ClientRecord[];
  const allInvoices = (invoicesRes.data || []) as InvoiceRecord[];
  const events = (eventsRes.data || []);

  // The invoices query above has no join to payments, so amount_paid is
  // missing on every row — getRemainingBalance() would silently treat every
  // invoice as fully unpaid. Fetch payments for just this (already filtered)
  // set of invoices and attach the real total.
  const invoiceIds = allInvoices.map((inv) => inv.id);
  const { data: paymentsData } = invoiceIds.length > 0
    ? await supabase.from("payments").select("invoice_id, amount").in("invoice_id", invoiceIds)
    : { data: [] as { invoice_id: string; amount: number }[] };

  const paidByInvoice: Record<string, number> = {};
  for (const p of paymentsData || []) {
    paidByInvoice[p.invoice_id] = (paidByInvoice[p.invoice_id] || 0) + (Number(p.amount) || 0);
  }
  for (const inv of allInvoices) {
    inv.amount_paid = paidByInvoice[inv.id] || 0;
  }

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
