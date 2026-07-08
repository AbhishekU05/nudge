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

    if (invoicesError) {
      console.error("Invoices error:", invoicesError);
      continue;
    }
    
    if (!invoices) {
      console.log("No invoices found");
      continue;
    }

    console.log(`Found ${invoices.length} invoices to check`);

    for (const invoice of invoices) {
      if (!invoice.due_date) continue;

      // Check Included Groups
      let isIncluded = true;
      if (policy.included_group_ids) {
        const { data: groupLinks } = await supabase
          .from("customer_groups")
          .select("group_id")
          .eq("customer_id", invoice.client_id || invoice.customer_id);
        
        const customerGroupIds = groupLinks?.map((g: any) => g.group_id) || [];
        
        if (customerGroupIds.length === 0) {
          isIncluded = policy.included_group_ids.includes("00000000-0000-0000-0000-000000000000");
        } else {
          isIncluded = policy.included_group_ids.some((id: string) => customerGroupIds.includes(id));
        }
      }
      if (!isIncluded) {
         console.log(`Skipping invoice ${invoice.id} (not included group)`);
         continue;
      }

      console.log(`Processing invoice ${invoice.id} for late fee`);
      // Simulating rest of logic
    }
  }
}

runLateFees().catch(console.error);
