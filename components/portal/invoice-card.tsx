import { getDaysOverdue } from "@/lib/types";
import { PromiseButton } from "./promise-button";

export function InvoiceCard({ 
  invoice, 
  token,
  type
}: { 
  invoice: any; 
  token: string;
  type: "overdue" | "due_soon" | "outstanding" | "paid"
}) {
  const balance = Math.max(0, Number(invoice.amount_owed) - Number(invoice.amount_paid));
  const overdueDays = invoice.due_date ? getDaysOverdue(invoice) : null;
  
  // Calculate days until due if not overdue
  let daysUntilDue = null;
  if (!overdueDays && invoice.due_date) {
    const [year, month, day] = invoice.due_date.split("-").map(Number);
    const due = new Date(year, month - 1, day);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-lg">
            {invoice.invoice_number ? `Invoice ${invoice.invoice_number}` : "Invoice"}
          </h3>
          
          {type === "overdue" && overdueDays !== null && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
              {overdueDays} days overdue
            </span>
          )}
          
          {type === "due_soon" && daysUntilDue !== null && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              Due in {daysUntilDue} days
            </span>
          )}
          
          {type === "paid" && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20">
              Paid
            </span>
          )}
        </div>
        
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          {type === "paid" && invoice.client_paid_at ? (
            `Paid: ${new Date(invoice.client_paid_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`
          ) : (
            `Due: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "No due date"}`
          )}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-end gap-4 sm:gap-6 sm:w-2/3">
        <p className="text-xl font-semibold">
          {new Intl.NumberFormat("en-US", { style: "currency", currency: invoice.currency }).format(type === "paid" ? (Number(invoice.amount_paid) > 0 ? Number(invoice.amount_paid) : Number(invoice.amount_owed)) : balance)}
        </p>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {type !== "paid" && (
            <PromiseButton 
              invoiceId={invoice.id} 
              token={token} 
              existingPromiseDate={invoice.promised_date} 
            />
          )}

          {type !== "paid" && invoice.payment_link && (
            <a 
              href={invoice.payment_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background h-10 px-4 text-sm bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 flex-1 sm:flex-none"
            >
              Pay Now
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
