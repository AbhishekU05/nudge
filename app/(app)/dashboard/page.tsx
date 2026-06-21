import Link from "next/link";
import { Container } from "@/components/site/container";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, AlertCircle, ArrowRight } from "lucide-react";
import { getDaysOverdue, type CustomerRecord } from "@/lib/types";

function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
  }).format(Number(value));
}

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: customersData } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id);

  const customers = (customersData || []) as CustomerRecord[];

  let totalCollected = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;

  for (const c of customers) {
    const paid = Number(c.amount_paid) || 0;
    const owed = Number(c.amount_owed) || 0;
    const remaining = Math.max(0, owed - paid);

    totalCollected += paid;
    totalOutstanding += remaining;

    const daysOverdue = getDaysOverdue(c);
    if (daysOverdue && remaining > 0 && !c.client_paid_at) {
      totalOverdue += remaining;
    }
  }

  // Get top 5 overdue/outstanding customers
  const actionNeeded = customers
    .filter((c) => {
      const remaining = Math.max(0, Number(c.amount_owed) - Number(c.amount_paid));
      return remaining > 0 && !c.client_paid_at && !c.unsubscribed;
    })
    .sort((a, b) => {
      const aOverdue = getDaysOverdue(a) || 0;
      const bOverdue = getDaysOverdue(b) || 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue; // Most overdue first
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    })
    .slice(0, 5);

  return (
    <div className="flex min-h-screen flex-col">
      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-8">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
              Overview
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
              Your business at a glance.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="bg-white/[0.025] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Total Outstanding</CardTitle>
                <DollarSign className="h-4 w-4 text-zinc-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-50">{formatCurrency(totalOutstanding)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white/[0.025] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Total Collected</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-50">{formatCurrency(totalCollected)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white/[0.025] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-50">{formatCurrency(totalOverdue)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50">Action Needed</h2>
            <Link href="/customers" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {actionNeeded.length > 0 ? (
            <div className="space-y-3">
              {actionNeeded.map((customer) => {
                const remaining = Math.max(0, Number(customer.amount_owed) - Number(customer.amount_paid));
                const daysOverdue = getDaysOverdue(customer);
                return (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.025] hover:bg-white/[0.05] transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-zinc-200">{customer.recipient_name}</h3>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        {daysOverdue ? <span className="text-red-400">{daysOverdue} days overdue</span> : "Outstanding"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-zinc-200">{formatCurrency(remaining, customer.currency)}</div>
                      <div className="text-sm text-zinc-500 mt-0.5">Remaining</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-zinc-500 mb-3" />
              <h3 className="text-sm font-medium text-zinc-200">You&apos;re all caught up</h3>
              <p className="text-sm text-zinc-500 mt-1">No customers currently need your attention.</p>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}
