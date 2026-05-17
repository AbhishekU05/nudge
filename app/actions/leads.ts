"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function captureLead(email: string) {
  const supabase = await createSupabaseServerClient();
  
  // Attempt to insert the lead. If it fails (e.g. table doesn't exist yet, or duplicate), we just ignore and continue
  // so the user experience isn't blocked.
  try {
    await supabase.from("leads").insert([{ email: email.toLowerCase() }]);
  } catch (err) {
    console.error("Error capturing lead:", err);
  }
}
