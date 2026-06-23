import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRemainingBalance } from "@/lib/types";
import { sendGmail } from "@/lib/gmail";
import { createXeroLateFeeInvoice } from "@/lib/xero-write";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("Invalid cron secret");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  // 1. Fetch active late fee policies
  const { data: policies, error: policiesError } = await supabase
    .from("late_fee_policies")
    .select("*")
    .eq("active", true);

  if (policiesError || !policies) {
    return new NextResponse("Error fetching policies", { status: 500 });
  }

  let processedCount = 0;

  // 2. Iterate policies
  for (const policy of policies) {
    // 3. Fetch invoices for this user
    // Only Outstanding, Partial, Overdue
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("*, clients!inner(id, name, email)")
      .eq("user_id", policy.user_id)
      .in("workflow_status", ["outstanding", "partial", "overdue"]);

    if (invoicesError || !invoices) continue;

    for (const invoice of invoices) {
      if (!invoice.due_date) continue;

      // Check Excluded Groups
      if (policy.excluded_group_ids && policy.excluded_group_ids.length > 0) {
        const { data: groupLinks } = await supabase
          .from("customer_groups")
          .select("group_id")
          .eq("customer_id", invoice.customer_id);
        
        const customerGroupIds = groupLinks?.map((g) => g.group_id) || [];
        const isExcluded = policy.excluded_group_ids.some((id: string) => customerGroupIds.includes(id));
        if (isExcluded) continue;
      }

      // Check Grace Period
      const dueDate = new Date(invoice.due_date);
      const now = new Date();
      const diffTime = now.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= policy.grace_period_days) {
        continue; // Still in grace period
      }

      // Check frequency / previously applied
      const { data: appliedFees } = await supabase
        .from("applied_late_fees")
        .select("applied_at")
        .eq("invoice_id", invoice.id)
        .eq("policy_id", policy.id)
        .order("applied_at", { ascending: false });

      if (appliedFees && appliedFees.length > 0) {
        if (policy.frequency === "once") continue;
        
        const lastApplied = new Date(appliedFees[0].applied_at);
        const diffSinceLast = Math.floor((now.getTime() - lastApplied.getTime()) / (1000 * 60 * 60 * 24));
        
        if (policy.frequency === "weekly" && diffSinceLast < 7) continue;
        if (policy.frequency === "monthly" && diffSinceLast < 30) continue;
      }

      // Calculate Fee
      let feeAmount = 0;
      const balance = Math.max(0, Number(invoice.amount_owed) - Number(invoice.amount_paid));
      if (balance <= 0) continue; // Safety check

      if (policy.fee_type === "flat") {
        feeAmount = Number(policy.fee_value);
      } else if (policy.fee_type === "percentage") {
        feeAmount = balance * (Number(policy.fee_value) / 100);
      }

      if (feeAmount <= 0) continue;
      feeAmount = Math.round(feeAmount * 100) / 100;

      // Apply Fee Logic
      let newAmountOwed = Number(invoice.amount_owed);

      if (policy.apply_to === "existing_invoice") {
        newAmountOwed += feeAmount;
        // Update local DB
        await supabase
          .from("invoices")
          .update({ amount_owed: newAmountOwed })
          .eq("id", invoice.id);
        
        // Add line item to existing invoice external logic (Skipped for simplicity, assumed manual or we use new_invoice usually)
      } else {
        // new_invoice - Write to Xero
        if (invoice.xero_invoice_id) {
          try {
            await createXeroLateFeeInvoice(
              policy.user_id,
              invoice.invoice_number || invoice.id,
              feeAmount,
              invoice.clients.name,
              invoice.clients.email
            );
          } catch (e) {
            console.error("Failed to write to Xero", e);
          }
        }
      }

      // Log in applied_late_fees
      await supabase.from("applied_late_fees").insert({
        invoice_id: invoice.id,
        policy_id: policy.id,
        amount: feeAmount
      });

      // Log in customer_events
      await supabase.from("customer_events").insert({
        invoice_id: invoice.id,
        customer_id: invoice.customer_id,
        user_id: policy.user_id,
        event_type: "late_fee",
        amount: feeAmount,
        currency: invoice.currency,
        note: `Applied late fee from policy: ${policy.name}`
      });

      // Send Email
      const newBalance = newAmountOwed - Number(invoice.amount_paid);
      if (invoice.clients.email) {
        await sendGmail({
          userId: policy.user_id,
          senderName: "Duely",
          senderEmail: "notifications@duely.in",
          to: invoice.clients.email,
          subject: `Late Fee Applied: Invoice ${invoice.invoice_number || ""}`,
          body: `<p>Hi ${invoice.clients.name},</p>
          <p>A late fee of ${feeAmount} ${invoice.currency} has been applied to your outstanding invoice ${invoice.invoice_number || ""}.</p>
          <p>Your new remaining balance is ${newBalance} ${invoice.currency}. Please remit payment as soon as possible.</p>
          <p>Thank you.</p>`,
          html: true
        });
      }

      processedCount++;
    }
  }

  return NextResponse.json({ success: true, processed: processedCount });
}
