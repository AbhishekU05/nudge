"use client";

import { useState } from "react";
import { InvoiceCard } from "@/components/portal/invoice-card";
import Link from "next/link";

type CurrencyGroup = [
  string,
  {
    outstanding: any[];
    overdue: any[];
    dueSoon: any[];
    paid: any[];
    totalOutstanding: number;
  }
];

export function ClientPortalView({
  client,
  agencyName,
  bankAccounts,
  currencyGroups,
  token,
}: {
  client: { name: string; id: string };
  agencyName: string;
  bankAccounts: any[];
  currencyGroups: CurrencyGroup[];
  token?: string;
}) {
  const [activeCurrency, setActiveCurrency] = useState<string>(
    currencyGroups[0]?.[0] ?? "USD"
  );

  const activeGroup = currencyGroups.find(([ccy]) => ccy === activeCurrency)?.[1];
  const hasTabs = currencyGroups.length > 1;

  const fmt = (amount: number, currency: string) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-20 flex flex-col gap-10">

        {/* Header */}
        <div className="flex flex-col gap-1">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium uppercase tracking-wider">
            Client Portal &bull; {agencyName}
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {client.name}
          </h1>
        </div>

        {/* Currency tabs + outstanding balance */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          {hasTabs && (
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
              {currencyGroups.map(([ccy, group]) => (
                <button
                  key={ccy}
                  onClick={() => setActiveCurrency(ccy)}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeCurrency === ccy
                      ? "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  {ccy}
                  {group.overdue.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold">
                      {group.overdue.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="p-6 sm:p-8 flex flex-col gap-1">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
              Total Outstanding{hasTabs ? ` · ${activeCurrency}` : ""}
            </p>
            <p className="text-4xl sm:text-5xl font-bold tracking-tight">
              {fmt(activeGroup?.totalOutstanding ?? 0, activeCurrency)}
            </p>
          </div>
        </div>

        {/* Bank details — live from Xero / QuickBooks, never stored in Duely */}
        {bankAccounts.length > 0 && (
          <div className="flex flex-col gap-4 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-lg font-semibold">How to Pay</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Bank details fetched live from your accountancy software.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {bankAccounts.map((bank, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                      {bank.name}
                    </p>
                    {bank.currency && (
                      <span className="text-xs uppercase font-semibold tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        {bank.currency}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                    {bank.accountNumber}
                  </p>
                  {bank.provider && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 capitalize">
                      via {bank.provider}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoice sections for active currency */}
        {activeGroup && (
          <>
            {activeGroup.overdue.length === 0 &&
            activeGroup.dueSoon.length === 0 &&
            activeGroup.outstanding.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                  No outstanding invoices in {activeCurrency}. 🎉
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-10">
                {activeGroup.overdue.length > 0 && (
                  <InvoiceSection
                    title="Overdue"
                    titleClass="text-red-600 dark:text-red-400"
                    invoices={activeGroup.overdue}
                    type="overdue"
                    token={token}
                    fmt={fmt}
                  />
                )}
                {activeGroup.dueSoon.length > 0 && (
                  <InvoiceSection
                    title="Due Soon"
                    titleClass="text-amber-600 dark:text-amber-500"
                    invoices={activeGroup.dueSoon}
                    type="due_soon"
                    token={token}
                    fmt={fmt}
                  />
                )}
                {activeGroup.outstanding.length > 0 && (
                  <InvoiceSection
                    title="Outstanding"
                    titleClass=""
                    invoices={activeGroup.outstanding}
                    type="outstanding"
                    token={token}
                    fmt={fmt}
                  />
                )}
              </div>
            )}

            {/* Paid history */}
            {activeGroup.paid.length > 0 && (
              <div className="flex flex-col gap-4 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                  Payment History
                </h2>
                <div className="flex flex-col gap-3">
                  {activeGroup.paid.map((inv: any) => (
                    <div key={inv.id} className="opacity-60 hover:opacity-100 transition-opacity">
                      <InvoiceCard invoice={inv} token={token || ""} type="paid" fmt={fmt} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="w-full py-8 text-center text-zinc-400 dark:text-zinc-500 text-sm border-t border-zinc-200 dark:border-zinc-800">
        <p>
          Powered by{" "}
          <Link
            href="https://duely.in"
            target="_blank"
            className="font-medium hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
          >
            Duely
          </Link>
        </p>
      </footer>
    </div>
  );
}

function InvoiceSection({
  title,
  titleClass,
  invoices,
  type,
  token,
  fmt,
}: {
  title: string;
  titleClass: string;
  invoices: any[];
  type: "overdue" | "due_soon" | "outstanding" | "paid";
  token?: string;
  fmt: (amount: number, currency: string) => string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className={`text-lg font-semibold ${titleClass}`}>{title}</h2>
      <div className="flex flex-col gap-3">
        {invoices.map((inv) => (
          <InvoiceCard key={inv.id} invoice={inv} token={token || ""} type={type} fmt={fmt} />
        ))}
      </div>
    </div>
  );
}
