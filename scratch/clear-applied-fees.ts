import { createClient } from "@supabase/supabase-js";

async function clearAppliedFees() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Deleting applied_late_fees...");
  
  const { error } = await supabase.from("applied_late_fees").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Deleted all applied late fees successfully!");
  }
}

clearAppliedFees();
