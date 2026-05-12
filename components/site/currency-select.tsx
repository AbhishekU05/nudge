"use client";

import { useState } from "react";
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

function getDefaultCurrency() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes("Kolkata") || tz.includes("Calcutta")) return "INR";
    if (tz.includes("Europe/London")) return "GBP";
    if (tz.includes("Europe/")) return "EUR";
    if (tz.includes("Toronto") || tz.includes("Vancouver")) return "CAD";
    if (tz.includes("Sydney") || tz.includes("Melbourne")) return "AUD";
    if (tz.includes("Tokyo")) return "JPY";
  } catch {}

  return "USD";
}

export function CurrencySelect({
  disabled,
  id,
  name = "currency",
}: {
  disabled?: boolean;
  id?: string;
  name?: string;
}) {
  const [currency, setCurrency] = useState(getDefaultCurrency);

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
