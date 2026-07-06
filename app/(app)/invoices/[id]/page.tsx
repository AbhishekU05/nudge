/* eslint-disable */
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerDetails } from "@/components/site/customer-details";
import type { CustomerRecord, PaymentLog, FollowUpLog, GroupRecord } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/site/container";

export default async function CustomerPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await props.params;
  const { tab } = await props.searchParams;
  const user = await requireUser();

  const supabase = await createSupabaseServerClient();

  const { data: customerData, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !customerData) {
    notFound();
  }

  // Fetch group if client_id exists
  let group: GroupRecord | undefined = undefined;
  if (customerData.client_id) {
    const { data: groupData } = await supabase
      .from("customer_groups")
      .select("groups(*)")
      .eq("customer_id", customerData.client_id)
      .maybeSingle();
      
    if (groupData?.groups) {
      group = groupData.groups as unknown as GroupRecord;
    }
  }

  // Fetch events for this invoice
  const { data: eventsData } = await supabase
    .from("events")
    .select("*")
    .eq("invoice_id", id)
    .order("created_at", { ascending: false });

  const { data: paymentsData } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", id)
    .order("created_at", { ascending: false });

  const payment_history: PaymentLog[] = (paymentsData ?? []).map((p: any) => ({
    id: p.id,
    invoice_id: p.invoice_id,
    customer_id: p.invoice_id,
    user_id: p.user_id || "",
    amount: Number(p.amount),
    currency: p.currency ?? "USD",
    source: p.payment_source || "user",
    created_at: p.created_at,
  }));

  const followup_history: FollowUpLog[] = (eventsData ?? []).map((e: any) => ({
    id: e.id,
    invoice_id: e.invoice_id,
    customer_id: e.invoice_id,
    user_id: e.user_id || "",
    method: e.followup_method || "other",
    outcome: e.followup_outcome || "no_response",
    note: e.description || null,
    followup_date: e.created_at,
    created_at: e.created_at,
  }));

  const amount_paid = payment_history.reduce((sum, p) => sum + p.amount, 0);

  const customerRecord: CustomerRecord = {
    ...customerData,
    amount_owed: Number(customerData.amount),
    amount_paid,
    workflow_status: customerData.status,
    customer_id: customerData.client_id,
    payment_history,
    followup_history,
  };

  const { isAutomationAndIntegrationAllowed } = await import("@/lib/payments");
  const { data: org } = await supabase
    .from("organizations")
    .select("dodo_subscription_status, created_at")
    .eq("id", customerData.organization_id)
    .single();
  const _isAllowed = org ? isAutomationAndIntegrationAllowed(org.dodo_subscription_status, org.created_at) : false;

  return (
    <div className="flex-1 overflow-y-auto">
      <Container className="py-6">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 mb-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <CustomerDetails 
          customer={customerRecord} 
          group={group} 
          initialTab={(tab as any) || "payment"} 
        />
      </Container>
    </div>
  );
}
