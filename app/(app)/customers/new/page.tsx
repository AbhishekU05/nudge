import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { createClient } from "@/app/actions/clients";
import { Container } from "@/components/site/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/payments";
import { getLocalizedMonthlyPrice } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function NewCustomerPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const searchParams = await props.searchParams;
  const { error } = searchParams;
  const monthlyPrice = await getLocalizedMonthlyPrice();

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("razorpay_subscription_status, razorpay_renews_at, created_at")
    .eq("user_id", user.id)
    .maybeSingle<{
      razorpay_subscription_status: string | null;
      razorpay_renews_at: string | null;
      created_at: string;
    }>();

  const hasSubscription = hasActiveSubscription(
    profile?.razorpay_subscription_status ?? null,
    profile?.created_at,
    profile?.razorpay_renews_at
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Customers
          </Link>
          <Badge variant={hasSubscription ? "success" : "warning"}>
            {hasSubscription ? "Plan active" : "Billing required"}
          </Badge>
        </Container>
      </header>

      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mx-auto max-w-2xl gap-6">
            {/* Main form */}
            <section className="space-y-6">
              <div>
                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                  Add customer
                </h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-zinc-500">
                  Add a new client to your CRM. You can create invoices and 
                  set up follow-up schedules for them later.
                </p>
              </div>

              {!hasSubscription && (
                <Card className="border-amber-500/20 bg-amber-500/10">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-amber-100">
                        Billing required
                      </p>
                      <p className="mt-1 text-sm leading-6 text-amber-100/70">
                        Activate your plan for {monthlyPrice.inline} to start
                        tracking customers.
                      </p>
                    </div>
                    <Link href="/settings/billing">
                      <Button>Open billing</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              <Card className={cn("bg-white/[0.035]", !hasSubscription && "opacity-60")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Customer details
                  </CardTitle>
                  <CardDescription>
                    Only the essentials.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={createClient} className="grid gap-5 sm:grid-cols-2">
                    {/* Name */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="name">Customer name / Company</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Acme Corp"
                        maxLength={100}
                        required
                        disabled={!hasSubscription}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="email">Customer email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="billing@acme.com"
                        maxLength={320}
                        disabled={!hasSubscription}
                      />
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="sm:col-span-2">
                        <p
                          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                          role="alert"
                        >
                          {error}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-end mt-4">
                      <Link href="/customers">
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full sm:w-auto"
                        >
                          Cancel
                        </Button>
                      </Link>
                      <Button
                        type="submit"
                        disabled={!hasSubscription}
                        className="w-full sm:w-auto"
                      >
                        Create customer
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </section>
          </div>
        </Container>
      </main>
    </div>
  );
}
