import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CLAUDE_REDIRECT_URI, MCP_SCOPE } from "@/lib/mcp/config";
import { approveMcpAuthorization } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function ErrorCard({ errors }: { errors: string[] }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6">
        <h1 className="text-lg font-medium text-rose-400">Authorization request rejected</h1>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-300">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default async function McpAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const clientId = first(sp.client_id);
  const redirectUri = first(sp.redirect_uri);
  const responseType = first(sp.response_type);
  const codeChallenge = first(sp.code_challenge);
  const codeChallengeMethod = first(sp.code_challenge_method);
  const state = first(sp.state);
  const scope = first(sp.scope) ?? MCP_SCOPE;

  const errors: string[] = [];
  if (responseType !== "code") errors.push("Unsupported response_type (expected 'code').");
  if (codeChallengeMethod !== "S256" || !codeChallenge) errors.push("PKCE with S256 is required.");
  if (!clientId) errors.push("Missing client_id.");
  if (!redirectUri) errors.push("Missing redirect_uri.");

  let clientName = "Claude";
  if (clientId && redirectUri) {
    const supabase = createSupabaseAdminClient();
    const { data: client } = await supabase
      .from("mcp_oauth_clients")
      .select("client_name, redirect_uris")
      .eq("client_id", clientId)
      .maybeSingle();
    if (!client) {
      errors.push("Unknown client_id.");
    } else {
      if (client.client_name) clientName = client.client_name;
      if (!Array.isArray(client.redirect_uris) || !client.redirect_uris.includes(redirectUri)) {
        errors.push("redirect_uri is not registered for this client.");
      }
    }
    if (redirectUri !== CLAUDE_REDIRECT_URI) {
      errors.push("redirect_uri is not the allowed Claude callback.");
    }
  }

  if (errors.length > 0) return <ErrorCard errors={errors} />;

  // Require login, returning to this exact request afterwards.
  const user = await getUser();
  if (!user) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      const v = first(value);
      if (v) qs.set(key, v);
    }
    redirect(`/login?next=${encodeURIComponent(`/mcp/authorize?${qs.toString()}`)}`);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
        <h1 className="text-xl font-semibold text-zinc-50">Connect {clientName} to Duely</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {clientName} is requesting <span className="font-medium text-zinc-200">read-only</span> access
          to your organization&apos;s accounts-receivable data.
        </p>

        <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">This will allow it to</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
            <li>Read AR summaries, invoices, payments, and clients</li>
            <li>Read late-fee and reminder activity</li>
          </ul>
          <p className="mt-3 text-xs text-zinc-500">
            It cannot create, edit, or delete anything, and cannot see other organizations&apos; data.
          </p>
        </div>

        <p className="mt-4 text-xs text-zinc-500">Signed in as {user.email}</p>

        <form action={approveMcpAuthorization} className="mt-5 flex gap-3">
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="redirect_uri" value={redirectUri} />
          <input type="hidden" name="code_challenge" value={codeChallenge} />
          {state ? <input type="hidden" name="state" value={state} /> : null}
          <input type="hidden" name="scope" value={scope} />
          <button
            type="submit"
            name="decision"
            value="deny"
            className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
          >
            Deny
          </button>
          <button
            type="submit"
            name="decision"
            value="approve"
            className="flex-1 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
          >
            Allow read-only access
          </button>
        </form>
      </div>
    </div>
  );
}
