import { inngest } from "@/lib/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAutomationAndIntegrationAllowed } from "@/lib/payments";

export const lateFeeWorkflow = inngest.createFunction(
  {
    id: "late-fee-workflow",
    triggers: [{ event: "invoice.evaluate_late_fee" }],
    cancelOn: [
      { event: "invoice.paid", match: "data.invoiceId" },
      { event: "invoice.due_date_updated", match: "data.invoiceId" },
      { event: "policy.updated", match: "data.organizationId" }
    ],
    concurrency: {
      limit: 1,
      key: "event.data.invoiceId"
    }
  },
  async ({ event, step }) => {
    const { invoiceId, organizationId } = event.data as { invoiceId: string; organizationId: string; };
    let isFinished = false;
    let loopCount = 0;

    while (!isFinished) {
      loopCount++;
      // 1. Fetch invoice and active policies
      const setup = await step.run(`fetch-and-evaluate-policies-${loopCount}`, async () => {
         const supabase = createSupabaseAdminClient();
         
         const { data: invoice } = await supabase
           .from("invoices")
           .select("*, clients!inner(id, name, email, unsubscribe_token)")
           .eq("id", invoiceId)
           .single();
           
         if (!invoice || !invoice.due_date || invoice.status === "paid" || invoice.status === "written_off") {
           return { skip: true, reason: "Invoice invalid, paid, written off, or missing due date" };
         }

         const { data: org } = await supabase
           .from("organizations")
           .select("dodo_subscription_status, created_at, timezone")
           .eq("id", organizationId)
           .single();

         if (!isAutomationAndIntegrationAllowed(org?.dodo_subscription_status, org?.created_at)) {
           return { skip: true, reason: "Subscription does not allow automation" };
         }

         const { data: policiesData } = await supabase
           .from("late_fee_policies")
           .select("*")
           .eq("organization_id", organizationId)
           .eq("active", true);

         const policies = policiesData as import("@/lib/types").LateFeePolicy[] | null;

         if (!policies || policies.length === 0) {
           return { skip: true, reason: "No active policies" };
         }

         const applicablePolicies = [];
         for (const policy of policies) {
           let isIncluded = true;
           if (policy.included_group_ids && policy.included_group_ids.length > 0) {
             const { data: groupLinks } = await supabase
               .from("customer_groups")
               .select("group_id")
               .eq("customer_id", invoice.client_id || invoice.customer_id);
             
             const customerGroupIds = (groupLinks || []).map((g: { group_id: string }) => g.group_id);
             if (customerGroupIds.length === 0) {
               isIncluded = policy.included_group_ids.includes("00000000-0000-0000-0000-000000000000");
             } else {
               isIncluded = policy.included_group_ids.some((id: string) => customerGroupIds.includes(id));
             }
           }
           if (isIncluded && new Date(invoice.created_at) >= new Date(policy.created_at)) {
             applicablePolicies.push(policy);
           }
         }

         if (applicablePolicies.length === 0) {
           return { skip: true, reason: "No policy applies to this customer" };
         }

         const timezone = org?.timezone || "UTC";
         const formatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });

         const duePolicies = [];
         let earliestNextDate = Infinity;

         for (const policy of applicablePolicies) {
           const { data: appliedFees } = await supabase
             .from("applied_late_fees")
             .select("applied_at")
             .eq("invoice_id", invoiceId)
             .eq("policy_id", policy.id)
             .order("applied_at", { ascending: false });

           if (appliedFees && appliedFees.length > 0 && policy.frequency === "once") {
             continue;
           }

           let baseDateStr = invoice.due_date;
           let daysToAdd = policy.grace_period_days;
           
           if (appliedFees && appliedFees.length > 0) {
             baseDateStr = appliedFees[0].applied_at;
             daysToAdd = policy.frequency === "weekly" ? 7 : 30; // monthly is ~30 days
           }

           const baseDate = new Date(baseDateStr);
           const nextFeeDate = new Date(baseDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
           
           const parts = formatter.formatToParts(nextFeeDate);
           const y = parts.find(p => p.type === "year")?.value;
           const m = parts.find(p => p.type === "month")?.value;
           const d = parts.find(p => p.type === "day")?.value;
           
           const sleepUntilDate = new Date(new Date(`${y}-${m}-${d}T00:00:00`).toLocaleString("en-US", { timeZone: "UTC" }) + " GMT");

           if (sleepUntilDate.getTime() <= Date.now()) {
              duePolicies.push(policy);
           } else {
              if (sleepUntilDate.getTime() < earliestNextDate) {
                  earliestNextDate = sleepUntilDate.getTime();
              }
           }
         }

         if (duePolicies.length === 0 && earliestNextDate === Infinity) {
             return { skip: true, reason: "All policies completely applied" };
         }

         return { 
           skip: false, 
           duePolicies, 
           sleepUntil: duePolicies.length === 0 ? new Date(earliestNextDate).toISOString() : null,
         };
      });

      if (setup.skip) {
        isFinished = true;
        continue;
      }

      // 2. Sleep until target date
      if ('sleepUntil' in setup && setup.sleepUntil) {
        const sleepMs = new Date(setup.sleepUntil).getTime() - Date.now();
        if (sleepMs > 0) {
            await step.sleepUntil(`wait-for-fee-date-${loopCount}`, setup.sleepUntil);
        }
        continue; // re-evaluate when waking up
      }

      // 3. Wake up and apply fee
      const actionResult = await step.run(`apply-late-fees-${loopCount}`, async () => {
         const supabase = createSupabaseAdminClient();
         
         const { data: currentInvoice } = await supabase
           .from("invoices")
           .select("*, clients!inner(id, name, email, unsubscribe_token)")
           .eq("id", invoiceId)
           .single();

         if (!currentInvoice || currentInvoice.status === "paid" || currentInvoice.status === "written_off") {
           return { done: true };
         }

         const balance = Math.max(0, Number(currentInvoice.amount_owed || currentInvoice.amount || 0) - Number(currentInvoice.amount_paid || 0));
         if (balance <= 0) return { done: true };

         const { data: members } = await supabase
           .from("organization_members")
           .select("user_id")
           .eq("organization_id", organizationId)
           .in("role", ["owner", "admin"])
           .limit(1);
         const adminUserId = members?.[0]?.user_id;
         if (!adminUserId) return { done: true };

         let anyApplied = false;

         for (const currentPolicy of ('duePolicies' in setup ? setup.duePolicies : [])) {
             const { data: freshPolicy } = await supabase.from("late_fee_policies").select("*").eq("id", currentPolicy.id).single();
             if (!freshPolicy || !freshPolicy.active) continue;

             const { data: appliedFees } = await supabase.from("applied_late_fees").select("applied_at").eq("invoice_id", invoiceId).eq("policy_id", freshPolicy.id).order("applied_at", { ascending: false });
             if (appliedFees && appliedFees.length > 0 && freshPolicy.frequency === "once") {
                 continue;
             }

             let feeAmount = 0;
             if (freshPolicy.fee_type === "flat") {
               feeAmount = Number(freshPolicy.fee_value);
             } else if (freshPolicy.fee_type === "percentage") {
               feeAmount = balance * (Number(freshPolicy.fee_value) / 100);
             }

             if (feeAmount <= 0) continue;
             feeAmount = Math.round(feeAmount * 100) / 100;

             const subject = `Late Fee Applied: Invoice ${currentInvoice.invoice_number || ""}`;
             let textBody = `Hi ${currentInvoice.clients.name},\n\nA separate invoice for a late fee of ${feeAmount} ${currentInvoice.currency} has been generated due to your outstanding invoice ${currentInvoice.invoice_number || ""}.\n\nPlease remit payment for both the original invoice and the late fee as soon as possible.\n\nThank you.`;
             if (currentInvoice.clients.unsubscribe_token) {
               textBody += `\n\nPayment Link: https://duely.in/portal/${currentInvoice.clients.unsubscribe_token}`;
             }

             let computedDueDate: string | undefined;
             if (freshPolicy.due_days !== undefined && freshPolicy.due_days !== null) {
               const dd = new Date();
               dd.setDate(dd.getDate() + Number(freshPolicy.due_days));
               computedDueDate = dd.toISOString().split("T")[0];
             }

             if (freshPolicy.auto_approve) {
               await inngest.send({
                 name: "invoice.apply_late_fee",
                 data: {
                   invoiceId,
                   policyId: freshPolicy.id,
                   organizationId,
                   adminUserId,
                   feeAmount,
                   dueDate: computedDueDate,
                   subject,
                   body_html: textBody.replace(/\n/g, '<br>')
                 }
               });
             } else {
               await supabase.from("email_drafts").insert({
                 organization_id: organizationId,
                 client_id: currentInvoice.client_id || currentInvoice.customer_id,
                 subject,
                 body_html: textBody.replace(/\n/g, '<br>'),
                 status: "draft",
                 action_type: "late_fee",
                 action_payload: {
                   invoice_id: invoiceId,
                   policy_id: freshPolicy.id,
                   fee_amount: feeAmount,
                   due_date: computedDueDate,
                   admin_user_id: adminUserId,
                 }
               });
             }

             anyApplied = true;
         }

         return { done: !anyApplied };
      });

      if (actionResult.done) {
        if (actionResult.done && ('duePolicies' in setup ? setup.duePolicies.length : 0) > 0) {
           isFinished = true; // exit loop if we couldn't apply anything
        } else if (actionResult.done) {
           isFinished = true;
        }
      }
    }

    return { status: "completed" };
  }
);
