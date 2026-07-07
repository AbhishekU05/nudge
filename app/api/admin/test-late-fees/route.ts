import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAutomationAndIntegrationAllowed } from "@/lib/payments";
import { updateXeroInvoiceWithLateFee, createXeroLateFeeInvoice } from "@/lib/xero-write";
import { updateQuickBooksInvoiceWithLateFee, createQuickBooksLateFeeInvoice } from "@/lib/quickbooks-write";

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    // 1. Fetch active late fee policies
    const { data: policies, error: policiesError } = await supabase
      .from("late_fee_policies")
      .select("*")
      .eq("active", true);

    if (policiesError || !policies) {
      return NextResponse.json({ error: "Error fetching policies" }, { status: 500 });
    }

    let processedCount = 0;

    for (const policy of policies) {
      // 2. Check subscription
      const { data: org } = await supabase
        .from("organizations")
        .select("dodo_subscription_status, created_at")
        .eq("id", policy.organization_id)
        .single();

      if (!isAutomationAndIntegrationAllowed(org?.dodo_subscription_status, org?.created_at)) {
        continue;
      }

      // Midnight check is intentionally bypassed for this test endpoint

      // 4. Fetch invoices for this organization
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*, clients!inner(id, name, email)")
        .eq("organization_id", policy.organization_id)
        .in("status", ["outstanding", "partial", "overdue"]);

      if (invoicesError || !invoices) continue;

      for (const invoice of invoices) {
        if (!invoice.due_date) continue;

        // Check Excluded Groups
        if (policy.excluded_group_ids && policy.excluded_group_ids.length > 0) {
          const { data: groupLinks } = await supabase
            .from("customer_groups")
            .select("group_id")
            .eq("customer_id", invoice.client_id || invoice.customer_id);
          
          const customerGroupIds = groupLinks?.map((g: Record<string, unknown>) => g.group_id as string) || [];
          let isExcluded = false;
          if (customerGroupIds.length === 0) {
            isExcluded = policy.excluded_group_ids.includes("00000000-0000-0000-0000-000000000000");
          } else {
            isExcluded = policy.excluded_group_ids.some((id: string) => customerGroupIds.includes(id));
          }
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
        const balance = Math.max(0, Number(invoice.amount_owed || invoice.amount || 0) - Number(invoice.amount_paid || 0));
        if (balance <= 0) continue; // Safety check

        if (policy.fee_type === "flat") {
          feeAmount = Number(policy.fee_value);
        } else if (policy.fee_type === "percentage") {
          feeAmount = balance * (Number(policy.fee_value) / 100);
        }

        if (feeAmount <= 0) continue;
        feeAmount = Math.round(feeAmount * 100) / 100;

        // Apply Fee Logic
        let newAmount = Number(invoice.amount_owed || invoice.amount || 0);

        if (policy.apply_to === "existing_invoice") {
          newAmount += feeAmount;
          // Update local DB
          await supabase
            .from("invoices")
            .update({ amount: newAmount })
            .eq("id", invoice.id);
            
          // Write to Xero or QuickBooks - Update existing invoice
          if (invoice.xero_id || invoice.xero_invoice_id) {
            try {
              await updateXeroInvoiceWithLateFee(
                policy.organization_id,
                invoice.xero_id || invoice.xero_invoice_id,
                feeAmount
              );
            } catch (err) {
              console.error("Failed to update invoice in Xero with late fee", err);
            }
          } else if (invoice.quickbooks_id || invoice.quickbooks_invoice_id) {
            try {
              await updateQuickBooksInvoiceWithLateFee(
                policy.organization_id,
                invoice.quickbooks_id || invoice.quickbooks_invoice_id,
                feeAmount
              );
            } catch (err) {
              console.error("Failed to update invoice in QuickBooks with late fee", err);
            }
          }
        } else {
          // new_invoice - Write to Xero or QuickBooks
          if (invoice.xero_id || invoice.xero_invoice_id) {
            try {
              await createXeroLateFeeInvoice(
                policy.organization_id,
                invoice.invoice_number || invoice.id,
                feeAmount,
                invoice.clients.name,
                invoice.clients.email
              );
            } catch (err) {
              console.error("Failed to write new late fee invoice to Xero", err);
            }
          } else if (invoice.quickbooks_id || invoice.quickbooks_invoice_id) {
            try {
              await createQuickBooksLateFeeInvoice(
                policy.organization_id,
                invoice.invoice_number || invoice.id,
                feeAmount,
                invoice.clients.name,
                invoice.clients.email
              );
            } catch (err) {
              console.error("Failed to write new late fee invoice to QuickBooks", err);
            }
          }
        }

        // Log in applied_late_fees
        await supabase.from("applied_late_fees").insert({
          organization_id: policy.organization_id,
          policy_id: policy.id,
          invoice_id: invoice.id,
          amount: feeAmount
        });

        // Log in activity
        await supabase.from("activities").insert({
          organization_id: policy.organization_id,
          customer_id: invoice.client_id || invoice.customer_id,
          invoice_id: invoice.id,
          event_type: "late_fee_applied",
          description: `Applied late fee of ${invoice.currency || "USD"} ${feeAmount} based on policy '${policy.name}'`
        });

        processedCount++;
      }
    }

    return NextResponse.json({ success: true, processedCount, message: `Successfully ran late fees logic. Applied to ${processedCount} invoices.` });

  } catch (error: unknown) {
    console.error("Error in test late fees endpoint:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
