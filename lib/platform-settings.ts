import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getQuickBooksMode(): Promise<"production" | "sandbox"> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("quickbooks_mode")
    .eq("id", 1)
    .single();
  
  return (data?.quickbooks_mode as "production" | "sandbox") || "production";
}

export async function setQuickBooksMode(mode: "production" | "sandbox") {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("platform_settings")
    .upsert({ id: 1, quickbooks_mode: mode });
}
