"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { buildPathWithQuery } from "@/lib/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revokeXeroIntegration, syncXeroInvoicesForUser } from "@/lib/xero";

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
