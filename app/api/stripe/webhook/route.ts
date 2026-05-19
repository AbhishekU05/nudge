import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { logger } from "@/lib/logger";
import { computeFirstReminderSendAt } from "@/lib/reminder-schedule";
import { createStripeClient } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeStripeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || null;
}

function toIsoDate(unixTimestamp: number | null | undefined) {
  if (!unixTimestamp) return null;
  return new Date(unixTimestamp * 1000).toISOString().slice(0, 10);
}

function getWorkflowStatus(dueDate: string | null) {
  if (!dueDate) return "outstanding";
  const today = new Date().toISOString().slice(0, 10);
  return dueDate < today ? "overdue" : "outstanding";
}



async function handleInvoiceCreated(invoice: Stripe.Invoice, userId: string) {
  const supabase = createSupabaseAdminClient();

  const email = normalizeStripeEmail(invoice.customer_email);
  if (!email) {
    logger.error({
      message: "Stripe invoice customer email missing",
      context: "stripe:webhook",
      user_id: userId,
      invoice_id: invoice.id,
    });
    return;
  }

  const name = invoice.customer_name?.trim() || email;
  const dueDate = toIsoDate(invoice.due_date);
  const updatePayload = {
    recipient_name: name,
    recipient_email: email,
    amount_owed: Number(invoice.amount_due ?? 0) / 100,
    amount_paid: 0,
    currency: invoice.currency.toUpperCase(),
    due_date: dueDate,
    stripe_invoice_id: invoice.id,
    payment_link: invoice.hosted_invoice_url,
    paid: false,
    client_paid_at: null,
    workflow_status: getWorkflowStatus(dueDate),
  };

  const { data: existingReminder } = await supabase
    .from("reminders")
    .select("id")
    .eq("user_id", userId)
    .eq("recipient_email", email)
    .maybeSingle<{ id: string }>();

  if (existingReminder) {
    const { error } = await supabase
      .from("reminders")
      .update(updatePayload)
      .eq("id", existingReminder.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await supabase.from("reminders").insert({
    user_id: userId,
    recipient_name: name,
    recipient_email: email,
    amount_owed: Number(invoice.amount_due ?? 0) / 100,
    amount_paid: 0,
    currency: invoice.currency.toUpperCase(),
    due_date: dueDate,
    custom_message: null,
    payment_link: invoice.hosted_invoice_url,
    stripe_invoice_id: invoice.id,
    paid: false,
    reminder_frequency_days: 7,
    next_send_at: computeFirstReminderSendAt(),
    active: false,
    unsubscribed: false,
    workflow_status: getWorkflowStatus(dueDate),
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("reminders")
    .update({
      amount_paid: invoice.amount_paid ? Number(invoice.amount_paid) / 100 : 0,
      paid: true,
      workflow_status: "paid",
      client_paid_at: new Date().toISOString(),
      active: false,
    })
    .eq("stripe_invoice_id", invoice.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();
  const stripe = createStripeClient();

  const supabase = createSupabaseAdminClient();
  const { data: connections } = await supabase
    .from("stripe_connections")
    .select("user_id, webhook_secret")
    .not("webhook_secret", "is", null);

  if (!connections || connections.length === 0) {
    return NextResponse.json({ error: "No configured webhooks found" }, { status: 400 });
  }

  let event: Stripe.Event | null = null;
  let matchedUserId: string | null = null;

  for (const conn of connections) {
    try {
      if (conn.webhook_secret) {
        event = stripe.webhooks.constructEvent(
          body,
          signature ?? "",
          conn.webhook_secret
        );
        matchedUserId = conn.user_id;
        break; // found the matching secret!
      }
    } catch {
      // signature mismatch, try next
    }
  }

  if (!event || !matchedUserId) {
    logger.error({
      message: "Invalid Stripe webhook signature for all user secrets",
      context: "stripe:webhook",
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    if (event.type === "invoice.created") {
      await handleInvoiceCreated(
        event.data.object as Stripe.Invoice,
        matchedUserId
      );
    }

    if (event.type === "invoice.paid") {
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
    }
  } catch (error) {
    logger.error({
      message: "Stripe webhook processing failed",
      context: "stripe:webhook",
      event_type: event.type,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
