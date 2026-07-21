import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/site/container";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Zap, Clock, Receipt, Users } from "lucide-react";
import { LocalTime } from "@/components/site/local-time";
import { DraftList } from "@/components/site/draft-list";
import { SentList } from "@/components/site/sent-list";

export const metadata = {
  title: "Automate | Duely",
};

export default async function AutomatePage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Fetch active clients (Statement Automations)
  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, name, active, auto_approve, reminder_type, next_send_at")
    .eq("active", true)
    .not("next_send_at", "is", null)
    .order("next_send_at", { ascending: true, nullsFirst: false });
  const clients = clientsData || [];

  // Fetch active invoices that need reminders
  const { data: invoicesData } = await supabase
    .from("invoices")
    .select("id, status, reminders_enabled, reminder_frequency_days, reminder_type, auto_approve, next_send_at, amount, currency, invoice_number, clients(name, email)")
    .eq("reminders_enabled", true)
    .not("next_send_at", "is", null)
    .in("status", ["outstanding", "promised", "partial", "overdue"])
    .order("next_send_at", { ascending: true, nullsFirst: false });
  const invoices = invoicesData || [];

  const totalAutomations = invoices.length + clients.length;

  const { isAutomationAndIntegrationAllowed } = await import("@/lib/payments");
  let isAllowed = true;
  const { data: member } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).single();
  if (member) {
    const { data: org } = await supabase.from("organizations").select("dodo_subscription_status, created_at").eq("id", member.organization_id).single();
    if (org) {
      isAllowed = isAutomationAndIntegrationAllowed(org.dodo_subscription_status, org.created_at);
    }
  }

  // "sending" is the transient state approveDraft claims a row into before it
  // hands the email to Resend. It belongs in this list: a row stranded there by a
  // crash mid-send would otherwise appear in neither the draft queue nor the sent
  // list, and there would be no way to see it, let alone retry it.
  const { data: draftsData } = await supabase
    .from("email_drafts")
    .select("id, subject, body_html, created_at, status, action_type, action_payload, clients(name, email)")
    .eq("organization_id", member?.organization_id)
    .in("status", ["draft", "sending"])
    .order("created_at", { ascending: false });

  const drafts = (draftsData || []).map((d) => {
    const rawClient = d.clients as unknown;
    const client = Array.isArray(rawClient) ? rawClient[0] : rawClient;
    return {
      id: d.id,
      subject: d.subject,
      body_html: d.body_html,
      created_at: d.created_at,
      status: d.status,
      action_type: d.action_type,
      action_payload: d.action_payload,
      clients: client as { name: string; email: string }
    };
  });

  // Names for the late-fee policies referenced by draft action_payloads, so the
  // approval queue can label each late-fee draft with its policy rather than a
  // bare id. Keyed by policy id.
  const { data: policiesData } = await supabase
    .from("late_fee_policies")
    .select("id, name")
    .eq("organization_id", member?.organization_id);
  const policyNames: Record<string, string> = {};
  for (const p of (policiesData || []) as { id: string; name: string }[]) {
    policyNames[p.id] = p.name;
  }

  const { data: sentData } = await supabase
    .from("email_drafts")
    .select("id, subject, body_html, sent_at, status, delivery_status, delivery_status_at, delivery_detail, clients(name, email)")
    .eq("organization_id", member?.organization_id)
    .in("status", ["sent", "failed"])
    .order("sent_at", { ascending: false })
    .limit(30);

  const sentEmails = (sentData || []).map((d) => {
    const rawClient = d.clients as unknown;
    const client = Array.isArray(rawClient) ? rawClient[0] : rawClient;
    return {
      id: d.id,
      subject: d.subject,
      body_html: d.body_html,
      sent_at: d.sent_at,
      status: d.status,
      delivery_status: d.delivery_status,
      delivery_status_at: d.delivery_status_at,
      delivery_detail: d.delivery_detail,
      clients: client as { name: string; email: string }
    };
  });

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
          
          <div className="mb-12">
            <DraftList initialDrafts={drafts} policyNames={policyNames} />
          </div>

          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Active Automations</h1>
            <Badge variant="muted" className="bg-white/5 hover:bg-white/10">{totalAutomations} running</Badge>
          </div>
          
          <p className="text-zinc-400 max-w-xl mb-12">
            Invoices and clients below have automatic reminders turned on. They will send based on their due date and the reminder settings.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
            {/* Statement Automations */}
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
                  clients.map((c) => {
                    const client = c as Record<string, string | number | boolean | null | undefined>;
                    return (
                    <Link 
                      key={String(client.id)} 
                      href={`/customers/${client.id}`}
                      className="block rounded-xl border border-white/10 bg-zinc-900/50 p-4 transition-colors hover:bg-white/[0.02] hover:border-white/20"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-zinc-200">{String(client.name)}</span>
                        <Badge variant={client.auto_approve ? "success" : "muted"}>
                          {client.auto_approve ? "Auto" : "Manual Review"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs border-t border-white/5 pt-3">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Zap className="h-3 w-3 text-amber-500/70" />
                          <span className="capitalize">{String(client.reminder_type)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Clock className="h-3 w-3 text-sky-500/70" />
                          <span>Next: {client.next_send_at ? <LocalTime value={String(client.next_send_at)} fallback="N/A" /> : "TBD"}</span>
                        </div>
                      </div>
                    </Link>
                  )})
                )}
              </div>
            </div>

            {/* Invoice Automations */}
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
                  invoices.map((inv) => {
                    const invoice = inv as unknown as Record<string, string | number | boolean | null | undefined | Record<string, unknown>>;
                    const clients = invoice.clients as { name?: string } | undefined;
                    return (
                    <Link 
                      key={String(invoice.id)} 
                      href={`/invoices/${invoice.id}`}
                      className="block rounded-xl border border-white/10 bg-zinc-900/50 p-4 transition-colors hover:bg-white/[0.02] hover:border-white/20"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-zinc-200">{clients?.name || "Unknown Client"}</span>
                          <p className="text-xs text-zinc-500 mt-0.5">{String(invoice.invoice_number || "Invoice")}</p>
                        </div>
                        <Badge variant={invoice.auto_approve ? "success" : "muted"}>
                          {invoice.auto_approve ? "Auto" : "Manual Review"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs border-t border-white/5 pt-3">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Zap className="h-3 w-3 text-amber-500/70" />
                          <span className="capitalize">{String(invoice.reminder_type || "Recurring")}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Clock className="h-3 w-3 text-sky-500/70" />
                          <span>Next: {invoice.next_send_at ? <LocalTime value={String(invoice.next_send_at)} fallback="N/A" /> : "TBD"}</span>
                        </div>
                      </div>
                    </Link>
                  )})
                )}
              </div>
            </div>
            
          </div>
          
          <SentList sentEmails={sentEmails} />
        </Container>
      </main>
    </div>
  );
}
