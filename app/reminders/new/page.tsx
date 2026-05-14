/*
 * /reminders/new — Set up automated email reminders for an existing customer.
 * Requires ?customer_id= query param. If missing, redirects to /customers/new.
 * Renders the AutomationSetupForm client component with live email preview.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Mail, User, AtSign, DollarSign } from "lucide-react";

import { AutomationSetupForm } from "@/components/site/automation-setup-form";
import { Container } from "@/components/site/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CustomerRecord } from "@/lib/types";

export default async function SetupAutomationPage({
  searchParams,
}: {
  searchParams: Promise<{ customer_id?: string; error?: string }>;
}) {
  const { customer_id, error } = await searchParams;

  // No customer_id → send to add-customer flow first
  if (!customer_id) {
    redirect("/customers/new");
  }

  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Fetch the customer — must belong to this user
  const { data: customer } = await supabase
    .from("reminders")
    .select(
      "id, recipient_name, recipient_email, amount_owed, currency, active, unsubscribed, workflow_status",
    )
    .eq("id", customer_id)
    .eq("user_id", user.id)
    .maybeSingle<
      Pick<
        CustomerRecord,
        | "id"
        | "recipient_name"
        | "recipient_email"
        | "amount_owed"
        | "currency"
        | "active"
        | "unsubscribed"
        | "workflow_status"
      >
    >();

  if (!customer) {
    redirect("/dashboard?error=Customer+not+found.");
  }

  if (customer.unsubscribed) {
    redirect(
      "/dashboard?error=This+customer+has+unsubscribed+from+reminders.",
    );
  }

  if (customer.workflow_status === "paid") {
    redirect(
      "/dashboard?error=This+customer+is+already+marked+as+paid.+Open+their+drawer+and+undo+the+payment+first.",
    );
  }

  const displayName: string =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "You";

  const amount = new Intl.NumberFormat(undefined, {
    currency: customer.currency,
    style: "currency",
  }).format(Number(customer.amount_owed));

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <Badge variant={customer.active ? "success" : "default"}>
            {customer.active ? "Automation active" : "Automation off"}
          </Badge>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mx-auto max-w-5xl space-y-8">
            {/* Page heading */}
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                Set up automation
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-zinc-500">
                Configure recurring email reminders for this customer. Pick a
                tone, customise the note, and set how often to send.
              </p>
            </div>

            {/* Customer context card */}
            <Card className="bg-white/[0.035]">
              <CardContent className="p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-600">
                  Sending reminders to
                </p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <User className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="font-semibold">{customer.recipient_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <AtSign className="h-3.5 w-3.5 text-zinc-500" />
                    {customer.recipient_email}
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <DollarSign className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="font-semibold text-zinc-200">{amount}</span>
                    <span>outstanding</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Mail className="h-3.5 w-3.5 text-zinc-500" />
                    Emails sent from Duely on your behalf
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive form + live preview */}
            <AutomationSetupForm
              customer={{
                id: customer.id,
                recipient_name: customer.recipient_name,
                recipient_email: customer.recipient_email,
                amount_owed: Number(customer.amount_owed),
                currency: customer.currency,
              }}
              senderName={displayName}
              error={error}
            />
          </div>
        </Container>
      </main>
    </div>
  );
}
