import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getRequiredEnv, getSupabaseUrl } from "@/lib/env";

export function createSupabaseAdminClient() {
  return createClient(
    getSupabaseUrl(),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
