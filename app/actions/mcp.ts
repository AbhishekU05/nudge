"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Revoke one of the current user's Claude connections. This deletes an MCP
// token row (our own bookkeeping) — not AR data — so it's an allowed mutation.
// Scoped to the caller's user_id so a user can only revoke their own tokens.
export async function disconnectMcpConnection(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createSupabaseAdminClient();
  await supabase.from("mcp_tokens").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/settings/integrations");
}
