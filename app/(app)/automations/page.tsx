import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/site/container";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Zap, Clock, PauseCircle, Users, Receipt } from "lucide-react";
import { LocalTime } from "@/components/site/local-time";

export const metadata = {
  title: "Automations | Duely",
};

export default async function AutomationsPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Fetch active clients
  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, name, email, reminder_type, reminder_frequency_days, next_send_at, auto_approve, active, sequence_index")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("next_send_at", { ascending: true });

  // Fetch active invoices
  const { data: invoicesData } = await supabase
    .from("invoices")
    .select("id, recipient_name, recipient_email, invoice_number, reminder_type, reminder_frequency_days, next_send_at, auto_approve, active, sequence_index")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("next_send_at", { ascending: true });

  const clients = clientsData || [];
  const invoices = invoicesData || [];
  const totalAutomations = clients.length + invoices.length;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Active Automations</h1>
            <Badge variant="muted" className="bg-white/5 hover:bg-white/10">{totalAutomations} running</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Clients Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-rose-400" />
                <h2 className="text-lg font-semibold text-zinc-100">Statement Automations</h2>
                <Badge variant="muted" className="ml-2">{clients.length}</Badge>
              </div>

              <div className="space-y-4">
                {clients.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                    <p className="text-sm text-zinc-500">No active statement automations.</p>
                  </div>
                ) : (
                  clients.map(client => (
                    <Link 
                      key={client.id} 
                      href={`/customers/${client.id}`}
                      className="block rounded-xl border border-white/10 bg-zinc-900/50 p-4 transition-colors hover:bg-white/[0.02] hover:border-white/20"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-zinc-200">{client.name}</span>
                        <Badge variant={client.auto_approve ? "success" : "muted"}>
                          {client.auto_approve ? "Auto" : "Queue"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Zap className="h-3 w-3 text-amber-500/70" />
                          <span className="capitalize">{client.reminder_type}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Clock className="h-3 w-3 text-sky-500/70" />
                          <span>Next: <LocalTime value={client.next_send_at} fallback="N/A" /></span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Invoices Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-zinc-100">Invoice Automations</h2>
                <Badge variant="muted" className="ml-2">{invoices.length}</Badge>
              </div>

              <div className="space-y-4">
                {invoices.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                    <p className="text-sm text-zinc-500">No active invoice automations.</p>
                  </div>
                ) : (
                  invoices.map(invoice => (
                    <Link 
                      key={invoice.id} 
                      href={`/invoices/${invoice.id}`}
                      className="block rounded-xl border border-white/10 bg-zinc-900/50 p-4 transition-colors hover:bg-white/[0.02] hover:border-white/20"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-zinc-200">{invoice.recipient_name}</span>
                          <p className="text-xs text-zinc-500 mt-0.5">{invoice.invoice_number || 'Invoice'}</p>
                        </div>
                        <Badge variant={invoice.auto_approve ? "success" : "muted"}>
                          {invoice.auto_approve ? "Auto" : "Queue"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Zap className="h-3 w-3 text-amber-500/70" />
                          <span className="capitalize">{invoice.reminder_type}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Clock className="h-3 w-3 text-sky-500/70" />
                          <span>Next: <LocalTime value={invoice.next_send_at} fallback="N/A" /></span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
