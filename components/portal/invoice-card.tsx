import { PromiseButton } from "./promise-button";

export interface PortalInvoice {
  id: string;
  amount_owed: number;
  amount_paid: number;
  balance: number;
  currency: string;
  invoice_number: string | null;
  due_date: string | null;
  payment_link: string | null;
  daysOverdue?: number | null;
  daysUntilDue?: number | null;
  isPaid?: boolean;
  promised_date?: string | null;
}

export function InvoiceCard({
  invoice,
  token,
  type,
  fmt,
}: {
  invoice: PortalInvoice;
  token: string;
  type: "overdue" | "due_soon" | "outstanding" | "paid";
  fmt: (amount: number, currency: string) => string;
}) {
  const { amount_owed, amount_paid, balance, currency, invoice_number, due_date, payment_link, daysOverdue, daysUntilDue } = invoice;

  // Partial payment: has some payment but not fully paid
  const hasPartialPayment = amount_paid > 0 && !invoice.isPaid;
  const paidPercent = amount_owed > 0 ? Math.min(100, (amount_paid / amount_owed) * 100) : 0;

  const dueDateLabel = due_date
    ? new Date(
        ...(due_date.split("-").map(Number) as [number, number, number]).map(
          (v, i) => (i === 1 ? v - 1 : v)
        ) as [number, number, number]
      ).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
      {/* Top row: invoice label + urgency badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base">
              {invoice_number ? `Invoice #${invoice_number}` : "Invoice"}
            </h3>

            {type === "overdue" && daysOverdue != null && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                {daysOverdue}d overdue
              </span>
            )}
            {type === "due_soon" && daysUntilDue != null && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                Due in {daysUntilDue}d
              </span>
            )}
            {type === "paid" && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                Paid
              </span>
            )}
            {hasPartialPayment && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                Partial
              </span>
            )}
          </div>

          {dueDateLabel && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {type === "paid" ? "Cleared" : "Due"}: {dueDateLabel}
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p className="text-lg font-bold tabular-nums">
            {fmt(type === "paid" ? amount_paid || amount_owed : balance, currency)}
          </p>
          {hasPartialPayment && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
              of {fmt(amount_owed, currency)}
            </p>
          )}
        </div>
      </div>

      {/* Partial payment progress bar */}
      {hasPartialPayment && (
        <div className="flex flex-col gap-1.5">
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${paidPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>{fmt(amount_paid, currency)} paid</span>
            <span>{fmt(balance, currency)} remaining</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {type !== "paid" && (
        <div className="flex items-center gap-3 flex-wrap pt-1">
          <PromiseButton
            invoiceId={invoice.id}
            token={token}
            existingPromiseDate={invoice.promised_date ?? null}
          />
          {payment_link && (
            <a
              href={payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-tight transition-colors h-9 px-4 text-sm bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Pay Now
            </a>
          )}
        </div>
      )}
    </div>
  );
}
