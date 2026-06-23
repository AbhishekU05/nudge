import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ArrowLeft, CheckCircle2, Mail, PlugZap, RefreshCw, Unplug, ShieldCheck, Download } from "lucide-react";

import { disconnectXero, syncXeroNow, disconnectQuickBooks, syncQuickBooksNow, disconnectGmail } from "@/app/actions/integrations";
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
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type IntegrationRow = {
  expires_at: string;
  last_synced_at: string | null;
  tenant_id?: string | null;
  realm_id?: string | null;
  bank_account_id?: string | null;
  bank_account_name?: string | null;
};

type GmailProfileRow = {
  google_access_token: string | null;
  google_refresh_token: string | null;
  gmail_connected_email: string | null;
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

  // Fetch Gmail connection status from profiles table
  const adminSupabase = createSupabaseAdminClient();
  const { data: gmailProfile } = await adminSupabase
    .from("profiles")
    .select("google_access_token, google_refresh_token, gmail_connected_email")
    .eq("user_id", user.id)
    .maybeSingle<GmailProfileRow>();

  const isGmailConnected = Boolean(
    gmailProfile?.google_access_token || gmailProfile?.google_refresh_token,
  );
  const gmailEmail = gmailProfile?.gmail_connected_email ?? null;

  const { data: xero } = await supabase
    .from("integrations")
    .select("tenant_id,last_synced_at,expires_at")
    .eq("user_id", user.id)
    .eq("provider", "xero")
    .maybeSingle<IntegrationRow>();

  const { data: quickbooks } = await supabase
    .from("integrations")
    .select("realm_id,last_synced_at,expires_at")
    .eq("user_id", user.id)
    .eq("provider", "quickbooks")
    .maybeSingle<IntegrationRow>();

  const { data: stripeConnection } = await supabase
    .from("stripe_connections")
    .select("stripe_account_id, webhook_secret")
    .eq("user_id", user.id)
    .maybeSingle<{ stripe_account_id: string | null; webhook_secret: string | null }>();

  const isConnectedXero = Boolean(xero);
  const isConnectedQuickBooks = Boolean(quickbooks);
  const hasAccountingIntegration = isConnectedXero || isConnectedQuickBooks;

  return (
    <div className="mx-auto max-w-4xl space-y-6">

            {(success || error) && (
              <div className="space-y-3">
                {success && <Notice variant="success">{success}</Notice>}
                {error && <Notice variant="error">{error}</Notice>}
              </div>
            )}

            {/* ── Gmail Integration Card ──────────────────────────── */}
            <Card className="overflow-hidden border-white/10 bg-white/[0.035]">
              <CardHeader className="border-b border-white/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Mail className="h-5 w-5 text-primary" />
                      Gmail
                    </CardTitle>
                    <CardDescription className="mt-2 max-w-xl">
                      Send reminder emails from your own Gmail address. If not
                      connected, reminders send from reminders@duely.in.
                    </CardDescription>
                  </div>
                  {isGmailConnected ? (
                    <Badge variant="success" className="gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="muted">Not connected</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                {isGmailConnected ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                        <p className="text-xs text-zinc-600">Status</p>
                        <p className="mt-2 text-sm font-semibold text-emerald-400">
                          Sending from your Gmail
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                        <p className="text-xs text-zinc-600">Connected account</p>
                        <p className="mt-2 truncate text-sm font-semibold text-zinc-100">
                          {gmailEmail ?? "Gmail account"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <p className="text-sm text-zinc-400">
                        <span className="font-medium text-zinc-200">Connected:</span>{" "}
                        Reminders send from your Gmail address. Clients see emails
                        directly from you.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <form action={disconnectGmail}>
                        <Button
                          type="submit"
                          variant="secondary"
                          className="w-full text-red-400 hover:text-red-300 sm:w-auto"
                        >
                          <Unplug className="h-3.5 w-3.5" />
                          Disconnect Gmail
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <p className="text-sm text-zinc-400">
                        <span className="font-medium text-zinc-200">Not connected:</span>{" "}
                        Reminders send from{" "}
                        <span className="font-mono text-xs text-zinc-300">reminders@duely.in</span>{" "}
                        with your name displayed as the sender.
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          Connect your Gmail account
                        </p>
                        <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-500">
                          Duely will only request permission to send emails on your
                          behalf. We never read your inbox.
                        </p>
                      </div>
                      <Link href="/api/integrations/gmail/connect">
                        <Button className="w-full sm:w-auto">Connect Gmail</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Xero Integration Card ──────────────────────────── */}
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
                  {isConnectedXero ? (
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
                  {isConnectedXero ? (
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

                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <p className="text-xs text-zinc-600">Dual Sync Bank Account</p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="truncate text-sm font-semibold text-zinc-100">
                          {xero?.bank_account_name ? xero.bank_account_name : "Not configured (Dual sync disabled)"}
                        </p>
                        <Link href="/settings/integrations/xero/bank">
                          <Button variant="secondary" size="sm">
                            {xero?.bank_account_id ? "Change" : "Setup"}
                          </Button>
                        </Link>
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
                    {hasAccountingIntegration ? (
                      <Button className="w-full sm:w-auto" disabled>Connect Xero</Button>
                    ) : (
                      <Link href="/api/integrations/xero/connect">
                        <Button className="w-full sm:w-auto">Connect Xero</Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── QuickBooks Integration Card ─────────────────────── */}
            <Card className="overflow-hidden border-white/10 bg-white/[0.035]">
              <CardHeader className="border-b border-white/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <PlugZap className="h-5 w-5 text-primary" />
                      QuickBooks
                    </CardTitle>
                    <CardDescription className="mt-2 max-w-xl">
                      Import outstanding invoices and keep Duely payment status
                      aligned with QuickBooks Online.
                    </CardDescription>
                  </div>
                  {isConnectedQuickBooks ? (
                    <Badge variant="success" className="gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Connected to QuickBooks
                    </Badge>
                  ) : (
                    <Badge variant="muted">Not connected</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                {isConnectedQuickBooks ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                        <p className="text-xs text-zinc-600">Last synced</p>
                        <p className="mt-2 text-sm font-semibold text-zinc-100">
                          {formatDate(quickbooks?.last_synced_at ?? null)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                        <p className="text-xs text-zinc-600">Company ID (Realm)</p>
                        <p className="mt-2 truncate font-mono text-xs text-zinc-300">
                          {quickbooks?.realm_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <form action={syncQuickBooksNow}>
                        <Button type="submit" className="w-full sm:w-auto">
                          <RefreshCw className="h-3.5 w-3.5" />
                          Sync now
                        </Button>
                      </form>
                      <form action={disconnectQuickBooks}>
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
                        Connect your QuickBooks company
                      </p>
                      <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-500">
                        Duely will request read-only invoice access to keep your
                        payment status aligned automatically.
                      </p>
                    </div>
                    {hasAccountingIntegration ? (
                      <Button className="w-full sm:w-auto" disabled>Connect QuickBooks</Button>
                    ) : (
                      <Link href="/api/integrations/quickbooks/connect">
                        <Button className="w-full sm:w-auto">Connect QuickBooks</Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>


    </div>
  );
}
