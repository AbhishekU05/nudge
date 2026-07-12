"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getXeroBankAccounts, type XeroBankAccountsResult } from "@/app/actions/xero";
import { Label } from "@/components/ui/label";

// The Xero bank account list is org-wide, but this component is rendered once per
// form (log payment, mark fully paid). Share one fetch across every instance
// instead of hitting the Xero API once per mount.
type Store = { result: XeroBankAccountsResult | null; loading: boolean };

let store: Store = { result: null, loading: false };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setStore(next: Store) {
  store = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function loadAccounts(force = false) {
  if (inflight) return inflight;
  if (!force && store.result) return Promise.resolve();

  setStore({ result: force ? null : store.result, loading: true });

  inflight = getXeroBankAccounts()
    .then((result) => setStore({ result, loading: false }))
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function XeroBankAccountSelect({ customerXeroId }: { customerXeroId?: string | null }) {
  const { result, loading } = useSyncExternalStore(
    subscribe,
    () => store,
    () => store,
  );

  useEffect(() => {
    if (!customerXeroId) return;
    loadAccounts();
  }, [customerXeroId]);

  if (!customerXeroId) return null;

  if (loading) {
    return (
      <div className="space-y-1 mt-3">
        <Label className="text-xs text-zinc-400">Sync to Xero Bank Account</Label>
        <div className="text-xs text-zinc-500 py-2">Loading bank accounts...</div>
      </div>
    );
  }

  if (!result) return null;

  if (!result.ok) {
    return (
      <div className="space-y-1 mt-3">
        <Label className="text-xs text-zinc-400">Sync to Xero Bank Account</Label>
        <div className="flex items-center gap-2 text-xs text-amber-400 py-2">
          <span>{result.error}</span>
          <button
            type="button"
            onClick={() => loadAccounts(true)}
            className="underline underline-offset-2 hover:text-amber-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (result.accounts.length === 0) return null;

  return (
    <div className="space-y-1 mt-3">
      <Label htmlFor="xero_bank_account_id" className="text-xs text-zinc-400">
        Sync to Xero Bank Account
      </Label>
      <select
        id="xero_bank_account_id"
        name="xero_bank_account_id"
        className="flex h-9 w-full rounded-md border border-white/10 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {result.accounts.map((acc) => (
          <option key={acc.id} value={acc.id} className="bg-zinc-900 text-zinc-100">
            {acc.name}
          </option>
        ))}
      </select>
    </div>
  );
}
