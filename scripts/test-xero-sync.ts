import { createClient } from "@supabase/supabase-js";
import { XeroClient } from "xero-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: integrations, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("provider", "xero");

  if (error || !integrations || integrations.length === 0) {
    console.error("No Xero integrations found", error);
    return;
  }

  const integration = integrations[0];
  console.log("Found integration for user", integration.user_id);

  // We need XERO_CLIENT_ID and XERO_CLIENT_SECRET to refresh token.
  // Wait, if they are not in .env.local, maybe they are in process.env?
  console.log("XERO_CLIENT_ID:", process.env.XERO_CLIENT_ID ? "set" : "missing");
}

run();
