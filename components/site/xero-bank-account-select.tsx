"use client";

import { useEffect, useState } from "react";
import { getXeroBankAccounts } from "@/app/actions/xero";
import { Label } from "@/components/ui/label";

export function XeroBankAccountSelect({ customerXeroId }: { customerXeroId?: string | null }) {
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerXeroId) return;

    let mounted = true;
    const fetchAccounts = async () => {
      setLoading(true);
      const data = await getXeroBankAccounts();
      if (mounted) {
        setAccounts(data);
        setLoading(false);
      }
    };
    
    fetchAccounts();

    return () => {
      mounted = false;
    };
  }, [customerXeroId]);

  if (!customerXeroId || accounts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1 mt-3">
      <Label htmlFor="xero_bank_account_id" className="text-xs text-zinc-400">
        Sync to Xero Bank Account
      </Label>
      {loading ? (
        <div className="text-xs text-zinc-500 py-2">Loading bank accounts...</div>
      ) : (
        <select
          id="xero_bank_account_id"
          name="xero_bank_account_id"
          className="flex h-9 w-full rounded-md border border-white/10 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id} className="bg-zinc-900 text-zinc-100">
              {acc.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
