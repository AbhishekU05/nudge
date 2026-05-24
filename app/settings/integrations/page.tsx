import Link from "next/link";
import { ArrowLeft, CheckCircle2, PlugZap, RefreshCw, Unplug } from "lucide-react";

import { disconnectXero, syncXeroNow } from "@/app/actions/integrations";
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
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type IntegrationRow = {
  expires_at: string;
  last_synced_at: string | null;
  tenant_id: string;
};

function Notice({
  children,
  variant,
}: {
  children: string;
  variant: "success" | "error";
}) {
  return (
    <p
      className={
        variant === "success"
          ? "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
          : "rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
      }
      role={variant === "error" ? "alert" : undefined}
    >
      {children}
    </p>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not synced yet";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await requireUser();
  const { error, success } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: xero } = await supabase
    .from("integrations")
    .select("tenant_id,last_synced_at,expires_at")
    .eq("user_id", user.id)
    .eq("provider", "xero")
    .maybeSingle<IntegrationRow>();

  const isConnected = Boolean(xero);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/settings/billing">
            <Button variant="ghost" size="sm">
              Billing
            </Button>
          </Link>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mx-auto max-w-4xl space-y-6">
            <div>
              <Badge variant={isConnected ? "success" : "default"}>
                {isConnected ? "Connected" : "Optional"}
              </Badge>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                Integrations
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
                Connect external tools for data sync. These integrations do not
                change how users sign in to Duely.
              </p>
            </div>

            {(success || error) && (
              <div className="space-y-3">
                {success && <Notice variant="success">{success}</Notice>}
                {error && <Notice variant="error">{error}</Notice>}
              </div>
            )}

            <Card className="overflow-hidden border-white/10 bg-white/[0.035]">
              <CardHeader className="border-b border-white/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <PlugZap className="h-5 w-5 text-primary" />
                      Xero
                    </CardTitle>
                    <CardDescription className="mt-2 max-w-xl">
                      Import outstanding invoices and keep Duely payment status
                      aligned with Xero.
                    </CardDescription>
                  </div>
                  {isConnected ? (
                    <Badge variant="success" className="gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Connected to Xero
                    </Badge>
                  ) : (
                    <Badge variant="muted">Not connected</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                {isConnected ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                        <p className="text-xs text-zinc-600">Last synced</p>
                        <p className="mt-2 text-sm font-semibold text-zinc-100">
                          {formatDate(xero?.last_synced_at ?? null)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                        <p className="text-xs text-zinc-600">Tenant ID</p>
                        <p className="mt-2 truncate font-mono text-xs text-zinc-300">
                          {xero?.tenant_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <form action={syncXeroNow}>
                        <Button type="submit" className="w-full sm:w-auto">
                          <RefreshCw className="h-3.5 w-3.5" />
                          Sync now
                        </Button>
                      </form>
                      <form action={disconnectXero}>
                        <Button
                          type="submit"
                          variant="secondary"
                          className="w-full text-red-400 hover:text-red-300 sm:w-auto"
                        >
                          <Unplug className="h-3.5 w-3.5" />
                          Disconnect
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        Connect your Xero organisation
                      </p>
                      <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-500">
                        Duely will request read-only invoice access plus offline
                        access so scheduled syncs can refresh tokens without
                        changing your login flow.
                      </p>
                    </div>
                    <Link href="/api/integrations/xero/connect">
                      <Button className="w-full sm:w-auto">Connect Xero</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  );
}
