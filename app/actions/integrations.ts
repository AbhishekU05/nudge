"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { buildPathWithQuery } from "@/lib/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revokeXeroIntegration, syncXeroInvoicesForUser } from "@/lib/xero";
import { revokeQuickBooksIntegration, syncQuickBooksInvoicesForUser } from "@/lib/quickbooks";

function redirectToIntegrations(params: { error?: string; success?: string }): never {
  redirect(buildPathWithQuery("/settings/integrations", params));
}

export async function syncXeroNow() {
  const user = await requireUser();
  let result: Awaited<ReturnType<typeof syncXeroInvoicesForUser>>;

  try {
    result = await syncXeroInvoicesForUser(user.id);
  } catch (error) {
    redirectToIntegrations({
      error: error instanceof Error ? error.message : "Unable to sync Xero.",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/integrations");
  redirectToIntegrations({
    success: `Xero sync complete. Imported ${result.imported}, updated ${result.updated}, marked paid ${result.markedPaid}.`,
  });
}

export async function disconnectXero() {
  const user = await requireUser();

  await revokeXeroIntegration(user.id);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "xero");

  if (error) {
    redirectToIntegrations({ error: "Unable to disconnect Xero." });
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/integrations");
  redirectToIntegrations({ success: "Xero disconnected." });
}

export async function syncQuickBooksNow() {
  const user = await requireUser();
  let result: Awaited<ReturnType<typeof syncQuickBooksInvoicesForUser>>;

  try {
    result = await syncQuickBooksInvoicesForUser(user.id);
  } catch (error) {
    redirectToIntegrations({
      error: error instanceof Error ? error.message : "Unable to sync QuickBooks.",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/integrations");
  redirectToIntegrations({
    success: `QuickBooks sync complete. Imported ${result.imported}, updated ${result.updated}, marked paid ${result.markedPaid}.`,
  });
}

export async function disconnectQuickBooks() {
  const user = await requireUser();

  await revokeQuickBooksIntegration(user.id);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("user_id", user.id)
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

export async function syncIntegrationBackground(provider: 'xero' | 'quickbooks') {
  const user = await requireUser();
  try {
    let result;
    if (provider === 'xero') {
      result = await syncXeroInvoicesForUser(user.id);
    } else {
      result = await syncQuickBooksInvoicesForUser(user.id);
    }
    revalidatePath("/dashboard");
    revalidatePath("/customers");
    revalidatePath("/pipeline");
    return { success: true, message: `Synced ${result.imported} imported, ${result.updated} updated.` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : `Unable to sync ${provider}.` };
  }
}

