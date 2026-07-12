import "server-only";

import { cache } from "react";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nudgeConfig } from "@/nudge.config";

export const getUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

export const requireUser = cache(async () => {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
});

export const requireAdmin = cache(async () => {
  const user = await requireUser();

  // The admin layout authorizes on nudgeConfig.adminEmails, but this gated on
  // profiles.is_admin alone. profiles rows are created lazily, so an admin who
  // has never changed a setting has no row at all: .single() then matched zero
  // rows, is_admin read as false, and every admin action silently redirected
  // away instead of running. Accept the same identity the layout does.
  if (user.email && nudgeConfig.adminEmails.includes(user.email)) {
    return user;
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    redirect("/dashboard");
  }

  return user;
});
