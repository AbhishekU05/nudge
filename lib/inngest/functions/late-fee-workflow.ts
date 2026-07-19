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

         // Never charge a late fee on a late fee. A fee generates its own invoice
         // in Xero/QuickBooks, which later syncs back into `invoices` and would
         // otherwise be evaluated like any other overdue invoice. We recognise it
         // by matching its accounting-software id against the generated-invoice
         // ids recorded when the fee was applied (process-late-fee.ts). Scoped to
         // this org via the invoices join so a QuickBooks id - unique only within
         // a realm - can't false-match a fee generated in another org.
         const xeroId = invoice.xero_id || invoice.xero_invoice_id;
         const qbId = invoice.quickbooks_id || invoice.quickbooks_invoice_id;
         if (xeroId || qbId) {
           const orClauses: string[] = [];
           if (xeroId) orClauses.push(`generated_xero_invoice_id.eq.${xeroId}`);
           if (qbId) orClauses.push(`generated_quickbooks_invoice_id.eq.${qbId}`);
           const { data: generatedMatch } = await supabase
             .from("applied_late_fees")
             .select("id, invoices!inner(organization_id)")
             .eq("invoices.organization_id", organizationId)
             .or(orClauses.join(","))
             .limit(1);
           if (generatedMatch && generatedMatch.length > 0) {
             return { skip: true, reason: "Invoice is itself a generated late fee" };
           }
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
           // A policy applies only to the groups it explicitly lists. An empty
           // included_group_ids means the policy targets no group and therefore
           // matches no invoice - it is NOT a wildcard for "every group". (The UI
           // and the create/update actions both reject saving an empty selection,
           // so an empty list here only comes from legacy rows.)
           let isIncluded = false;
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
           // Policies apply to every unpaid invoice in their included groups,
           // regardless of whether the invoice predates the policy. Creating a
           // policy after invoices already exist still covers them (the
           // policy-create action re-evaluates every unpaid invoice), and a
           // past-grace invoice is charged immediately per the fee-date logic
           // below.
           if (isIncluded) {
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

           const dayMs = 24 * 60 * 60 * 1000;
           const intervalDays = policy.frequency === "weekly" ? 7 : policy.frequency === "monthly" ? 30 : 0;

           // Anchor the whole cadence to when this policy actually began charging
           // the invoice: normally its due date + grace, but never earlier than
           // the policy's own creation. The clamp stops a policy created long
           // after an invoice fell overdue from backfilling every period between
           // the old due date and today - the first fee lands at creation, then
           // the cadence runs forward from there.
           const anchor = Math.max(
             new Date(invoice.due_date).getTime() + Number(policy.grace_period_days) * dayMs,
             new Date(policy.created_at).getTime()
           );

           // The Nth fee (0-indexed by how many have already been applied) is
           // fixed at anchor + N*interval, independent of when prior fees were
           // actually applied or approved. A slow approval therefore never pushes
           // the next fee out: if its scheduled date has already passed by the
           // time the previous fee is approved, the next one is simply due now.
           const appliedCount = appliedFees?.length ?? 0;
           const nextFeeDate = new Date(anchor + appliedCount * intervalDays * dayMs);
           
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

         // Remaining balance = invoice total minus payments recorded so far.
         // The invoices row has no amount_paid column, so sum the payments;
         // percentage fees below are charged on this outstanding amount, not
         // the original total.
         const { data: paidRows } = await supabase
           .from("payments")
           .select("amount")
           .eq("invoice_id", invoiceId);
         const amountPaid = (paidRows || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
         const balance = Math.max(0, Number(currentInvoice.amount || 0) - amountPaid);
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

             // A first fee whose due date (invoice due date + grace) had already
             // passed by the time the policy was created is a retroactive,
             // immediate catch-up rather than a fee that accrued in real time.
             // These always route to a draft for human review, even when the
             // policy is auto-approve, so creating a policy can't silently charge
             // fees on invoices that were already overdue when it was created.
             const isFirstApplication = !(appliedFees && appliedFees.length > 0);
             const firstFeeDueTime = new Date(currentInvoice.due_date).getTime() + Number(freshPolicy.grace_period_days) * 24 * 60 * 60 * 1000;
             const isRetroactiveImmediate = isFirstApplication && firstFeeDueTime <= new Date(freshPolicy.created_at).getTime();

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

             if (freshPolicy.auto_approve && !isRetroactiveImmediate) {
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
               // A draft isn't recorded in applied_late_fees until it's approved,
               // so the setup step keeps seeing this fee as due on every
               // re-evaluation. Skip if a pending draft for this (invoice, policy)
               // already exists so the loop can't stack duplicate drafts; with
               // nothing applied this pass, it then settles (done = !anyApplied).
               const { data: existingDrafts } = await supabase
                 .from("email_drafts")
                 .select("id")
                 .eq("organization_id", organizationId)
                 .eq("action_type", "late_fee")
                 .in("status", ["draft", "sending"])
                 .contains("action_payload", { invoice_id: invoiceId, policy_id: freshPolicy.id })
                 .limit(1);
               if (existingDrafts && existingDrafts.length > 0) continue;

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
