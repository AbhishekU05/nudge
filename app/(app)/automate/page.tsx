import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/site/container";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Zap, Clock, Users, Receipt } from "lucide-react";
import { LocalTime } from "@/components/site/local-time";
import { DraftList } from "@/components/site/draft-list";

export const metadata = {
  title: "Automate | Duely",
};

export default async function AutomatePage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Fetch drafts
  const { data: drafts } = await supabase
    .from("email_drafts")
    .select("*, clients(name, email)")
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  // Fetch active clients
  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, name, email, reminder_type, reminder_frequency_days, next_send_at, auto_approve, active, sequence_index")
    .eq("active", true)
    .order("next_send_at", { ascending: true });

  // Fetch active invoices
  const { data: invoicesData } = await supabase
    .from("invoices")
    .select("id, status, clients(name, email)")
    .eq("reminders_enabled", true)
    .order("next_send_at", { ascending: true });

  const clients = clientsData || [];
  const invoices = invoicesData || [];
  const totalAutomations = clients.length + invoices.length;
  const draftList = drafts || [];

  const { isAutomationAndIntegrationAllowed } = await import("@/lib/payments");
  let isAllowed = true;
  const { data: member } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).single();
  if (member) {
    const { data: org } = await supabase.from("organizations").select("dodo_subscription_status, created_at").eq("id", member.organization_id).single();
    if (org) {
      isAllowed = isAutomationAndIntegrationAllowed(org.dodo_subscription_status, org.created_at);
    }
  }

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Container className="py-8 sm:py-10 max-w-lg text-center">
          <Zap className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50 mb-2">Automations Disabled</h1>
          <p className="text-zinc-400 mb-6">You must upgrade to a paid subscription to use automated payment reminders.</p>
          <Link 
            href="/settings/billing"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
          >
            Upgrade Plan
          </Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          
          {/* Queue Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Queue</h1>
              <Badge variant="muted" className="bg-white/5 hover:bg-white/10">{draftList.length} waiting</Badge>
            </div>
            <p className="mt-2 text-zinc-400 max-w-xl mb-6">
              Review and approve automated emails before they are sent. 
            </p>
            
            <DraftList initialDrafts={draftList} />
          </div>

          {/* Automations Section */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-50">Active Automations</h2>
              <Badge variant="muted" className="bg-white/5 hover:bg-white/10">{totalAutomations} running</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Clients Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-rose-400" />
                  <h3 className="text-lg font-semibold text-zinc-100">Statement Automations</h3>
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
                            {client.auto_approve ? "Auto" : "Manual Review"}
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
                  <h3 className="text-lg font-semibold text-zinc-100">Invoice Automations</h3>
                  <Badge variant="muted" className="ml-2">{invoices.length}</Badge>
                </div>

                <div className="space-y-4">
                  {invoices.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                      <p className="text-sm text-zinc-500">No active invoice automations.</p>
                    </div>
                  ) : (
                    invoices.map((invoice: any) => (
                      <Link 
                        key={invoice.id} 
                        href={`/invoices/${invoice.id}`}
                        className="block rounded-xl border border-white/10 bg-zinc-900/50 p-4 transition-colors hover:bg-white/[0.02] hover:border-white/20"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium text-zinc-200">{invoice.clients?.name || "Unknown"}</span>
                            <p className="text-xs text-zinc-500 mt-0.5">{invoice.id || 'Invoice'}</p>
                          </div>
                          <Badge variant={invoice.auto_approve ? "success" : "muted"}>
                            {invoice.auto_approve ? "Auto" : "Manual Review"}
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
          </div>
        </Container>
      </main>
    </div>
  );
}
