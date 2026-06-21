"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function CurrencySelector({
  currencies,
  selected,
}: {
  currencies: string[];
  selected: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (currencies.length <= 1) return null;

  return (
    <select
      value={selected}
      onChange={(e) => {
        const val = e.target.value;
        const params = new URLSearchParams(searchParams.toString());
        params.set("currency", val);
        router.push(`${pathname}?${params.toString()}`);
      }}
      className="h-9 w-[120px] rounded-md border border-white/10 bg-white/[0.05] px-3 py-1 text-sm text-zinc-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
    >
      {currencies.map((c) => (
        <option key={c} value={c} className="bg-[#18181b] text-zinc-200">
          {c}
        </option>
      ))}
    </select>
  );
}
