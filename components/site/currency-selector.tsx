"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <Select
      value={selected}
      onValueChange={(val) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("currency", val);
        router.push(`${pathname}?${params.toString()}`);
      }}
    >
      <SelectTrigger className="w-[120px] h-9 bg-white/[0.05] border-white/10 text-zinc-200">
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
