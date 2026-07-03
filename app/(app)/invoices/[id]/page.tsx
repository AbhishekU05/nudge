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

  // Fetch group if customer_id exists
  let group: GroupRecord | undefined = undefined;
  if (customerData.customer_id) {
    const { data: groupData } = await supabase
      .from("customer_groups")
      .select("groups(*)")
      .eq("customer_id", customerData.customer_id)
      .maybeSingle();
      
    if (groupData?.groups) {
      group = groupData.groups as unknown as GroupRecord;
    }
  }

  // Fetch events for this customer
  const { data: eventsData } = await supabase
    .from("customer_events")
    .select("*")
    .eq("invoice_id", id)
    .order("created_at", { ascending: false });

  const payment_history: PaymentLog[] = [];
  const followup_history: FollowUpLog[] = [];

  for (const event of eventsData ?? []) {
    if (event.event_type === "payment") {
      payment_history.push({
        id: event.id,
        invoice_id: event.invoice_id,
        customer_id: event.customer_id,
        user_id: event.user_id,
        amount: Number(event.amount),
        currency: event.currency ?? "USD",
        source: (event.payment_source as any) || "user",
        created_at: event.created_at,
      });
    } else if (event.event_type === "followup") {
      followup_history.push({
        id: event.id,
        invoice_id: event.invoice_id,
        customer_id: event.customer_id,
        user_id: event.user_id,
        method: event.followup_method as any,
        outcome: event.followup_outcome as any,
        note: event.note,
        followup_date: event.event_date,
        created_at: event.created_at,
      });
    }
  }

  const customerRecord: CustomerRecord = {
    ...customerData,
    amount_owed: Number(customerData.amount_owed),
    amount_paid: Number(customerData.amount_paid),
    payment_history,
    followup_history,
  };

  const { isAutomationAndIntegrationAllowed } = await import("@/lib/payments");
  const { data: org } = await supabase
    .from("organizations")
    .select("dodo_subscription_status, created_at")
    .eq("id", customerData.organization_id)
    .single();
  const isAllowed = org ? isAutomationAndIntegrationAllowed(org.dodo_subscription_status, org.created_at) : false;

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
          isAllowed={isAllowed}
          initialTab={(tab as any) || "payment"} 
          isDevelopment={process.env.NODE_ENV === "development"} 
        />
      </Container>
    </div>
  );
}
