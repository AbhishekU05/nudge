"use client";

import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, Phone, CreditCard, Send, DollarSign, Clock } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function ActivityFeed({ events }: { events: Record<string, unknown>[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-12 text-center bg-white/[0.01]">
        <Clock className="mx-auto h-8 w-8 text-zinc-600" />
        <h3 className="mt-4 text-lg font-semibold text-zinc-100">No activity yet</h3>
        <p className="mt-2 text-sm text-zinc-500 max-w-sm">
          Once you start tracking payments and sending follow-ups, your activity history will appear here.
        </p>
      </div>
    );
  }

  return (
    <Card className="bg-white/[0.02] border-white/10 overflow-hidden">
      <CardContent className="p-0">
        <ul className="divide-y divide-white/5">
          {events.map((e) => {
            const event = e as Record<string, string | number | boolean | null | undefined | Record<string, unknown>>;
            const isPayment = event.event_type === "payment";
            const clients = event.clients as { name?: string } | undefined;
            const invoices = event.invoices as { clients?: { name?: string } } | undefined;
            const customerName = clients?.name || invoices?.clients?.name || "Unknown Customer";

            return (
              <li key={String(event.id)} className="p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-4">
                  {/* Icon Badge */}
                  <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${isPayment ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-blue-500/20 bg-blue-500/10 text-blue-500"}`}>
                    {isPayment ? <DollarSign className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <p className="text-sm font-medium text-zinc-200">
                        {isPayment 
                          ? "Payment Logged" 
                          : event.event_type === "note" 
                            ? "Note Added"
                            : event.event_type === "reminder_sent"
                              ? "Automated Reminder Sent"
                              : event.event_type === "status_change"
                                ? "Status Changed"
                                : event.event_type === "late_fee_applied"
                                  ? "Late Fee Applied"
                                  : "Follow-up Sent"}
                      </p>
                      <time dateTime={String(event.event_date || event.created_at)} className="text-xs text-zinc-500">
                        {formatDistanceToNow(new Date(String(event.event_date || event.created_at)), { addSuffix: true })}
                      </time>
                    </div>
                    
                    <p className="text-sm text-zinc-400">
                      {isPayment ? (
                        <>
                          Recorded a payment of <span className="font-semibold text-zinc-300">{formatCurrency(Number(event.amount || 0))}</span> from{" "}
                          <Link href={`/${event.raw_invoice_id ? 'invoices' : 'customers'}/${event.raw_invoice_id || event.raw_client_id}`} className="text-primary hover:underline">
                            {customerName}
                          </Link>
                        </>
                      ) : event.event_type === "note" ? (
                        <>
                          Added an internal note for{" "}
                          <Link href={`/${event.raw_invoice_id ? 'invoices' : 'customers'}/${event.raw_invoice_id || event.raw_client_id}`} className="text-primary hover:underline">
                            {customerName}
                          </Link>
                        </>
                      ) : event.event_type === "reminder_sent" ? (
                        event.raw_invoice_id ? (
                          <>
                            System sent an automated reminder for invoice <span className="font-semibold text-zinc-300">{(event.invoices as { invoice_number?: string })?.invoice_number || "Invoice"}</span> to{" "}
                            <Link href={`/invoices/${event.raw_invoice_id}`} className="text-primary hover:underline">
                              {customerName}
                            </Link>
                          </>
                        ) : (
                          <>
                            System sent an automated statement to{" "}
                            <Link href={`/customers/${event.raw_client_id}`} className="text-primary hover:underline">
                              {customerName}
                            </Link>
                          </>
                        )
                      ) : event.event_type === "status_change" ? (
                        <>
                          Invoice status updated for{" "}
                          <Link href={`/${event.raw_invoice_id ? 'invoices' : 'customers'}/${event.raw_invoice_id || event.raw_client_id}`} className="text-primary hover:underline">
                            {customerName}
                          </Link>
                        </>
                      ) : event.event_type === "late_fee_applied" ? (
                        <>
                          Late fee automatically applied for{" "}
                          <Link href={`/${event.raw_invoice_id ? 'invoices' : 'customers'}/${event.raw_invoice_id || event.raw_client_id}`} className="text-primary hover:underline">
                            {customerName}
                          </Link>
                        </>
                      ) : (
                        <>
                          Followed up with{" "}
                          <Link href={`/${event.raw_invoice_id ? 'invoices' : 'customers'}/${event.raw_invoice_id || event.raw_client_id}`} className="text-primary hover:underline">
                            {customerName}
                          </Link>{" "}
                          via <span className="capitalize">{String(event.followup_method || "email")}</span>
                        </>
                      )}
                    </p>

                    {/* Meta / Notes */}
                    {(event.note || event.payment_source || event.followup_outcome) && (
                      <div className="mt-2 flex flex-wrap gap-2 pt-2">
                        {event.payment_source && (
                          <Badge variant="muted" className="text-xs font-normal">
                            <CreditCard className="mr-1 h-3 w-3" />
                            {String(event.payment_source)}
                          </Badge>
                        )}
                        {event.followup_method === "email" && (
                          <Badge variant="muted" className="text-xs font-normal">
                            <Mail className="mr-1 h-3 w-3" />
                            Email
                          </Badge>
                        )}
                        {event.followup_method === "phone" && (
                          <Badge variant="muted" className="text-xs font-normal">
                            <Phone className="mr-1 h-3 w-3" />
                            Phone
                          </Badge>
                        )}
                        {event.followup_method === "whatsapp" && (
                          <Badge variant="muted" className="text-xs font-normal">
                            <MessageCircle className="mr-1 h-3 w-3" />
                            WhatsApp
                          </Badge>
                        )}
                        {event.followup_outcome && (
                          <Badge variant={event.followup_outcome === "promise_made" ? "success" : "muted"} className="text-xs font-normal capitalize">
                            {String(event.followup_outcome).replace(/_/g, " ")}
                          </Badge>
                        )}
                        {event.note && (
                          <p className="text-sm italic text-zinc-500 w-full mt-1 border-l-2 border-white/10 pl-3">
                            &quot;{String(event.note)}&quot;
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
