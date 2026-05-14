import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Container } from "@/components/site/container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function PaymentReceivedPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex flex-1 items-center">
        <Container className="py-12">
          <Card className="mx-auto max-w-lg bg-white/[0.035]">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-200">
                <AlertCircle className="h-5 w-5" />
              </div>
              <CardTitle>Missing link</CardTitle>
              <CardDescription>
                This payment confirmation link is incomplete.
              </CardDescription>
            </CardHeader>
          </Card>
        </Container>
      </div>
    );
  }

  const supabase = createSupabaseAdminClient();

  // Fetch the amount_owed so we can set amount_paid correctly
  const { data: reminder } = await supabase
    .from("reminders")
    .select("amount_owed")
    .eq("unsubscribe_token", token)
    .maybeSingle<{ amount_owed: number }>();

  // customer_paid_at is set ONLY via this path (customer self-reporting).
  // Agent-marked payments (from the dashboard) never touch this field,
  // so it remains an unambiguous signal of who confirmed the payment.
  const { data, error } = await supabase
    .from("reminders")
    .update({
      client_paid_at: new Date().toISOString(),
      workflow_status: "paid",
      amount_paid: reminder?.amount_owed ?? 0,
      active: false,
    })
    .eq("unsubscribe_token", token)
    .select("id")
    .maybeSingle<{ id: string }>();

  const succeeded = Boolean(data) && !error;

  return (
    <div className="flex flex-1 items-center">
      <Container className="py-12">
        <Card className="mx-auto max-w-lg bg-white/[0.035]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300">
              {succeeded ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-200" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-200" />
              )}
            </div>
            <CardTitle>
              {succeeded ? "Payment noted" : "Request failed"}
            </CardTitle>
            <CardDescription>
              {succeeded
                ? "Thanks. The sender will see that you marked this invoice as paid."
                : "We could not process this payment confirmation link."}
            </CardDescription>
          </CardHeader>
          {!succeeded ? (
            <CardContent className="text-center text-sm text-zinc-500">
              The link may be invalid or expired.
            </CardContent>
          ) : null}
        </Card>
      </Container>
    </div>
  );
}
