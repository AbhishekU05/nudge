"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { buildPathWithQuery } from "@/lib/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revokeXeroIntegration, syncXeroInvoicesForOrg } from "@/lib/xero";
import { revokeQuickBooksIntegration, syncQuickBooksInvoicesForOrg } from "@/lib/quickbooks";
import { inngest } from "@/lib/inngest/client";

function redirectToIntegrations(params: { error?: string; success?: string }): never {
  redirect(buildPathWithQuery("/settings/integrations", params));
}

async function getOrganizationId(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.organization_id ?? null;
}

export async function syncXeroNow() {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToIntegrations({ error: "No organization found." });

  try {
    await inngest.send({
      name: "xero/integration.connected",
      data: { organization_id: organizationId },
    });
  } catch (error) {
    redirectToIntegrations({
      error: error instanceof Error ? error.message : "Unable to trigger Xero sync.",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/integrations");
  redirectToIntegrations({
    success: `Xero sync started in the background. Your invoices will appear shortly.`,
  });
}

export async function disconnectXero() {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToIntegrations({ error: "No organization found." });

  await revokeXeroIntegration(organizationId!);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("organization_id", organizationId!)
    .eq("provider", "xero");

  if (error) {
    redirectToIntegrations({ error: "Unable to disconnect Xero." });
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/integrations");
  redirectToIntegrations({ success: "Xero disconnected." });
}

export async function selectXeroTenant(formData: FormData) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToIntegrations({ error: "No organization found." });

  const tenantId = formData.get("tenantId")?.toString();
  if (!tenantId) redirectToIntegrations({ error: "No tenant selected." });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("integrations")
    .update({ tenant_id: tenantId })
    .eq("organization_id", organizationId)
    .eq("provider", "xero");

  if (error) {
    redirectToIntegrations({ error: "Unable to select Xero tenant." });
  }

  try {
    await inngest.send({
      name: "xero/integration.connected",
      data: { organization_id: organizationId },
    });
  } catch (syncError) {
    redirectToIntegrations({
      error: syncError instanceof Error ? syncError.message : "Tenant selected, but unable to trigger Xero sync.",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/integrations");
  redirect(`/settings/integrations/xero/bank?success=Xero connected. Initial sync started in the background.`);
}

export async function syncQuickBooksNow() {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToIntegrations({ error: "No organization found." });

  let result: Awaited<ReturnType<typeof syncQuickBooksInvoicesForOrg>>;
  try {
    result = await syncQuickBooksInvoicesForOrg(organizationId!);
  } catch (error) {
    redirectToIntegrations({
      error: error instanceof Error ? error.message : "Unable to sync QuickBooks.",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/integrations");
  redirectToIntegrations({
    success: `QuickBooks sync complete. Imported ${result!.imported}, updated ${result!.updated}, marked paid ${result!.markedPaid}.`,
  });
}

export async function disconnectQuickBooks() {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToIntegrations({ error: "No organization found." });

  await revokeQuickBooksIntegration(organizationId!);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("organization_id", organizationId!)
    .eq("provider", "quickbooks");

  if (error) {
    redirectToIntegrations({ error: "Unable to disconnect QuickBooks." });
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/integrations");
  redirectToIntegrations({ success: "QuickBooks disconnected." });
}

export async function disconnectGmail() {
  const user = await requireUser();
  const adminSupabase = (await import("@/lib/supabase/admin")).createSupabaseAdminClient();

  const { error } = await adminSupabase
    .from("profiles")
    .update({
      google_access_token: null,
      google_refresh_token: null,
      gmail_connected_email: null,
    })
    .eq("user_id", user.id);

  if (error) {
    redirectToIntegrations({ error: "Unable to disconnect Gmail." });
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/integrations");
  redirectToIntegrations({ success: "Gmail disconnected. Reminders will now send from reminders@duely.in." });
}

/**
 * On-demand sync triggered from the UI "Sync Now" button.
 * Replaces the old dailyBackgroundSync cron pattern.
 */
export async function syncIntegrationNow(provider: "xero" | "quickbooks") {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) return { success: false, message: "No organization found." };

  try {
    let result;
    if (provider === "xero") {
      await inngest.send({ name: "xero/integration.connected", data: { organization_id: organizationId } });
      result = { imported: 0, updated: 0 }; // Background job
    } else {
      result = await syncQuickBooksInvoicesForOrg(organizationId);
    }
    revalidatePath("/dashboard");
    revalidatePath("/customers");
    return { success: true, message: provider === "xero" ? "Sync started in background." : `Synced ${result.imported} imported, ${result.updated} updated.` };
  } catch (error) {
    return { success: false, message: `Server Error: Unable to sync ${provider}.` };
  }
}

/**
 * @deprecated Use syncIntegrationNow instead.
 * Kept for backward compatibility with components that haven't been migrated.
 */
export const syncIntegrationBackground = syncIntegrationNow;

/**
 * @deprecated Replaced by event-driven Xero/QuickBooks webhooks (Milestone 6).
 * Kept as a no-op stub so the DashboardBackgroundSync component compiles.
 * Remove once that component is updated to use webhooks.
 */
export async function dailyBackgroundSync(): Promise<{ success: boolean; message?: string }> {
  // Cron-based daily sync was removed in Milestone 2 (Zero-Cron Architecture).
  // Syncing now happens via push webhooks from Xero/QuickBooks.
  // This stub exists solely to prevent the dashboard-background-sync component
  // from breaking until it is updated to remove this call.
  return { success: true };
}
