"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

const MAX_LENGTH = 100;

export function CustomerSearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  function submit() {
    // Client-side trimming/length-capping here is UX only — it keeps
    // obviously malformed input from ever being sent in the common case,
    // but it is NOT a security boundary: anyone can call the API directly
    // with any value, bypassing this component entirely. The real
    // protection is server-side (sanitizeSearchTerm in page.tsx) combined
    // with Supabase's query builder, which parameterizes values rather than
    // concatenating raw SQL strings in the first place.
    const trimmed = value.trim().slice(0, MAX_LENGTH);
    const next = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      next.set("q", trimmed);
    } else {
      next.delete("q");
    }
    next.set("page", "1");
    router.push(`/customers?${next.toString()}`);
  }

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        maxLength={MAX_LENGTH}
        placeholder="Search customers... (press Enter)"
        className="w-full rounded-md border border-white/10 bg-white/[0.05] py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  );
}
