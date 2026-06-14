"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

export async function captureLifetimeDealLead(email: string) {
  const supabase = createSupabaseAdminClient();
  
  try {
    const { error } = await supabase.from("leads").upsert([{ 
      email: email.toLowerCase(),
      referral_source: 'lifetime_deal'
    }], { onConflict: 'email' });

    if (error) {
      console.error("Error capturing lifetime lead:", error);
      return { success: false, error: 'unknown' };
    }
    
    return { success: true };
  } catch (err) {
    console.error("Error capturing lifetime lead:", err);
    return { success: false, error: 'unknown' };
  }
}

export async function getRemainingLifetimeSpots() {
  const supabase = await createSupabaseServerClient();
  const maxSpots = 10;
  
  try {
    const { count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('referral_source', 'lifetime_deal');
      
    if (error) {
      console.error("Error fetching remaining spots:", error);
      return maxSpots;
    }
    
    const spotsLeft = Math.max(0, maxSpots - (count || 0));
    return spotsLeft;
  } catch (err) {
    console.error("Error fetching remaining spots:", err);
    return maxSpots;
  }
}
