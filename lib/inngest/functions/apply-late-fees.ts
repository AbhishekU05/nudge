import { inngest } from "@/lib/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRemainingBalance } from "@/lib/types";
import { sendGmail } from "@/lib/gmail";
import { createXeroLateFeeInvoice } from "@/lib/xero-write";
import { hasActiveSubscription } from "@/lib/payments";

export const applyLateFees = inngest.createFunction(
  { id: "apply-late-fees", triggers: [{ cron: "0 * * * *" }] }, // Hourly
  async ({ step }) => {
    const supabase = createSupabaseAdminClient();

    // 1. Fetch active late fee policies
    const { data: policies, error: policiesError } = await supabase
      .from("late_fee_policies")
      .select("*")
      .eq("active", true);

    if (policiesError || !policies) {
      throw new Error("Error fetching policies");
    }

    let processedCount = 0;

    for (const policy of policies) {
      // 2. Check subscription
      const { data: org } = await supabase
        .from("organizations")
        .select("dodo_subscription_status")
        .eq("id", policy.organization_id)
        .single();

      if (!hasActiveSubscription(org?.dodo_subscription_status)) {
        continue;
      }

      // 3. Find owner/admin of organization to act as user for external APIs (Gmail/Xero)
      const { data: members } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", policy.organization_id)
        .in("role", ["owner", "admin"])
        .limit(1);

      const adminUserId = members?.[0]?.user_id;
      if (!adminUserId) continue;

      // 3b. Fetch the admin's timezone and check if it's midnight locally
      const { data: profile } = await supabase
        .from("profiles")
        .select("timezone")
        .eq("user_id", adminUserId)
        .single();
      
      const timezone = profile?.timezone || "UTC";
      const formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone });
      const hourStr = formatter.formatToParts(new Date()).find(p => p.type === "hour")?.value;
      const isMidnight = hourStr === "24" || hourStr === "0" || hourStr === "00";

      if (!isMidnight) {
        continue; // It's not midnight in the organization's local timezone
      }

      // 4. Fetch invoices for this organization
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*, clients!inner(id, name, email)")
        .eq("organization_id", policy.organization_id)
        .in("status", ["outstanding", "partial", "overdue"]); // Note: legacy used workflow_status, new uses status

      if (invoicesError || !invoices) continue;

      for (const invoice of invoices) {
        if (!invoice.due_date) continue;

        // Check Excluded Groups
        if (policy.excluded_group_ids && policy.excluded_group_ids.length > 0) {
          const { data: groupLinks } = await supabase
            .from("customer_groups")
            .select("group_id")
            .eq("customer_id", invoice.client_id || invoice.customer_id);
          
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
            .update({ amount_owed: newAmount, amount: newAmount })
            .eq("id", invoice.id);
        } else {
          // new_invoice - Write to Xero
          if (invoice.xero_id || invoice.xero_invoice_id) {
            try {
              await createXeroLateFeeInvoice(
                adminUserId,
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

        // Log in events
        await supabase.from("events").insert({
          invoice_id: invoice.id,
          client_id: invoice.client_id || invoice.customer_id,
          organization_id: policy.organization_id,
          event_type: "late_fee_applied",
          description: `Applied late fee of ${feeAmount} ${invoice.currency} from policy: ${policy.name}`
        });

        // Send Email
        const newBalance = newAmount - Number(invoice.amount_paid || 0);
        if (invoice.clients.email) {
          await sendGmail({
            userId: adminUserId,
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

    return { success: true, processed: processedCount };
  }
);
