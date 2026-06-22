"use server";

import { requireAdmin } from "@/lib/auth";
import { sendWeeklyDigestEmails } from "@/lib/email/send-digest";
import { revalidatePath } from "next/cache";

export async function testDigestEmail() {
  const user = await requireAdmin();
  
  const result = await sendWeeklyDigestEmails(user.id);
  
  if (result.success) {
    console.log(`Sent ${result.count} digest emails.`);
  } else {
    console.error("Failed to send digest emails", result.error);
  }
  
  revalidatePath("/admin");
}

export async function wipeAdminData() {
  const user = await requireAdmin();
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createSupabaseAdminClient();
  
  await supabase.from("customer_events").delete().eq("user_id", user.id);
  await supabase.from("email_drafts").delete().eq("user_id", user.id);
  await supabase.from("invoices").delete().eq("user_id", user.id);
  await supabase.from("clients").delete().eq("user_id", user.id);
  
  revalidatePath("/");
}
