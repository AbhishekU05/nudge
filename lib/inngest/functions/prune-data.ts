import { inngest } from "@/lib/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const pruneData = inngest.createFunction(
  { id: "prune-data", triggers: [{ cron: "0 0 * * 0" }] }, // Runs every Sunday at midnight
  async () => {
    const supabase = createSupabaseAdminClient();

    // Calculate the cutoff date (2.5 years ago)
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 30); // 2.5 years = 30 months
    const dateStr = cutoffDate.toISOString();

    // We use a raw delete statement or just a select and then batch delete.
    // However, Supabase lets us delete directly using filters:
    const { data, error } = await supabase
      .from("invoices")
      .delete()
      .eq("status", "paid")
      .lt("updated_at", dateStr)
      .select("id"); // Returns the IDs that were deleted

    if (error) {
      console.error("Failed to prune old data:", error);
      throw new Error(`Prune failed: ${error.message}`);
    }

    return { 
      success: true, 
      prunedCount: data ? data.length : 0 
    };
  }
);
