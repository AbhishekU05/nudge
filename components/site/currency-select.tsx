"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "INR", label: "INR (₹)" },
  { value: "CAD", label: "CAD ($)" },
  { value: "AUD", label: "AUD ($)" },
  { value: "JPY", label: "JPY (¥)" },
];

export function CurrencySelect({
  disabled,
  id,
  name = "currency",
}: {
  disabled?: boolean;
  id?: string;
  name?: string;
}) {
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes("Kolkata") || tz.includes("Calcutta")) setCurrency("INR");
      else if (tz.includes("Europe/London")) setCurrency("GBP");
      else if (tz.includes("Europe/")) setCurrency("EUR");
      else if (tz.includes("Toronto") || tz.includes("Vancouver")) setCurrency("CAD");
      else if (tz.includes("Sydney") || tz.includes("Melbourne")) setCurrency("AUD");
      else if (tz.includes("Tokyo")) setCurrency("JPY");
    } catch {}
  }, []);

  return (
    <select
      id={id}
      name={name}
      disabled={disabled}
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 hover:border-white/20 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
      )}
    >
      {CURRENCIES.map((c) => (
        <option key={c.value} value={c.value} className="bg-zinc-900 text-zinc-100">
          {c.label}
        </option>
      ))}
    </select>
  );
}
