import { createClient } from "@supabase/supabase-js";

async function runLateFees() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error("Missing env vars");
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Starting late fees run...");

  const { data: policies, error: policiesError } = await supabase
    .from("late_fee_policies")
    .select("*")
    .eq("active", true);

  if (policiesError || !policies) {
    console.error("Error fetching policies:", policiesError);
    return;
  }

  console.log(`Found ${policies.length} policies`);

  for (const policy of policies) {
    console.log(`Processing policy ${policy.name} for org ${policy.organization_id}`);

    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("*, clients!inner(id, name, email)")
      .eq("organization_id", policy.organization_id)
      .in("status", ["outstanding", "partial", "overdue"]);

    if (invoicesError || !invoices) continue;

    for (const invoice of invoices) {
      if (!invoice.due_date) continue;

      if (policy.excluded_group_ids && policy.excluded_group_ids.length > 0) {
        const { data: groupLinks } = await supabase
          .from("customer_groups")
          .select("group_id")
          .eq("customer_id", invoice.client_id || invoice.customer_id);
        
        const customerGroupIds = groupLinks?.map((g: any) => g.group_id) || [];
        let isExcluded = false;
        if (customerGroupIds.length === 0) {
          isExcluded = policy.excluded_group_ids.includes("00000000-0000-0000-0000-000000000000");
        } else {
          isExcluded = policy.excluded_group_ids.some((id: string) => customerGroupIds.includes(id));
        }
        if (isExcluded) continue;
      }

      const dueDate = new Date(invoice.due_date);
      const now = new Date();
      const diffTime = now.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= policy.grace_period_days) continue;

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

      let feeAmount = 0;
      const balance = Math.max(0, Number(invoice.amount_owed || invoice.amount || 0) - Number(invoice.amount_paid || 0));
      if (balance <= 0) continue;

      if (policy.fee_type === "flat") {
        feeAmount = Number(policy.fee_value);
      } else if (policy.fee_type === "percentage") {
        feeAmount = balance * (Number(policy.fee_value) / 100);
      }

      if (feeAmount <= 0) continue;

      console.log(`Applying fee ${feeAmount} to invoice ${invoice.id}`);
      
      // I am stopping here so I don't execute write code.
      throw new Error(`Everything worked up to fee execution! feeAmount=${feeAmount}`);
    }
  }
}

runLateFees().catch(console.error);
