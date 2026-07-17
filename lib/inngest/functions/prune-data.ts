import { inngest } from "@/lib/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const pruneData = inngest.createFunction(
  { id: "prune-data", triggers: [{ cron: "0 0 * * 0" }] }, // Runs every Sunday at midnight
  async () => {
    const supabase = createSupabaseAdminClient();

    // Cutoff 2.5 years ago (30 months). Half a year past the 2-year sync window,
    // so an invoice still within re-sync range is never pruned.
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 30);
    const dateStr = cutoffDate.toISOString().slice(0, 10); // due_date is a DATE

    // Prune settled invoices (paid or written off) whose invoice date is older
    // than the cutoff. Keyed on due_date (reliably populated from Xero), NOT
    // updated_at: a recent re-sync bumps updated_at, which would otherwise keep a
    // genuinely-old invoice alive forever. Cascades to its payments/events/fees.
    const { data, error } = await supabase
      .from("invoices")
      .delete()
      .in("status", ["paid", "written_off"])
      .lt("due_date", dateStr)
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
