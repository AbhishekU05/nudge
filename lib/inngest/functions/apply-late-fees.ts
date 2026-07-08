import { inngest } from "@/lib/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAutomationAndIntegrationAllowed } from "@/lib/payments";

export const applyLateFees = inngest.createFunction(
  { id: "apply-late-fees", triggers: [{ cron: "0 * * * *" }] }, // Hourly
  async () => {
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
        .select("dodo_subscription_status, created_at")
        .eq("id", policy.organization_id)
        .single();

      if (!isAutomationAndIntegrationAllowed(org?.dodo_subscription_status, org?.created_at)) {
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

      // if (!isMidnight) {
      //   continue; // It's not midnight in the organization's local timezone
      // }

      // 4. Fetch invoices for this organization
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*, clients!inner(id, name, email, unsubscribe_token)")
        .eq("organization_id", policy.organization_id)
        .in("status", ["outstanding", "partial", "overdue"]); // Note: legacy used workflow_status, new uses status

      if (invoicesError || !invoices) continue;

      for (const invoice of invoices) {
        if (!invoice.due_date) continue;

        // Check Included Groups
        let isIncluded = true;
        if (policy.included_group_ids) {
          const { data: groupLinks } = await supabase
            .from("customer_groups")
            .select("group_id")
            .eq("customer_id", invoice.client_id || invoice.customer_id);
          
          const customerGroupIds = groupLinks?.map((g) => g.group_id) || [];
          if (customerGroupIds.length === 0) {
            isIncluded = policy.included_group_ids.includes("00000000-0000-0000-0000-000000000000");
          } else {
            isIncluded = policy.included_group_ids.some((id: string) => customerGroupIds.includes(id));
          }
        }
        if (!isIncluded) continue;

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

        // Build Email Content
        const newAmount = Number(invoice.amount_owed || invoice.amount || 0) + feeAmount;
        const subject = `Late Fee Applied: Invoice ${invoice.invoice_number || ""}`;
        let textBody = `Hi ${invoice.clients.name},\n\nA late fee of ${feeAmount} ${invoice.currency} has been applied to your outstanding invoice ${invoice.invoice_number || ""}.\n\nYour new remaining balance is ${newAmount - Number(invoice.amount_paid || 0)} ${invoice.currency}. Please remit payment as soon as possible.\n\nThank you.`;
        if (invoice.clients.unsubscribe_token) {
          textBody += `\n\nPayment Link: https://duely.in/portal/${invoice.clients.unsubscribe_token}`;
        }

        if (policy.auto_approve) {
          // Send to Inngest to process individually
          await inngest.send({
            name: "invoice.apply_late_fee",
            data: {
              invoiceId: invoice.id,
              policyId: policy.id,
              organizationId: policy.organization_id,
              adminUserId,
              feeAmount,
              subject,
              body_html: textBody.replace(/\n/g, '<br>')
            }
          });
        } else {
          // Put in automate tab (email_drafts)
          await supabase.from("email_drafts").insert({
            organization_id: policy.organization_id,
            client_id: invoice.client_id || invoice.customer_id,
            subject,
            body_html: textBody.replace(/\n/g, '<br>'),
            status: "draft",
            action_type: "late_fee",
            action_payload: {
              invoice_id: invoice.id,
              policy_id: policy.id,
              fee_amount: feeAmount,
              admin_user_id: adminUserId,
            }
          });
        }

        processedCount++;
      }
    }

    return { success: true, processed: processedCount };
  }
);
