import "server-only";

import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/env";

// Cached per request: without this, every independent call (root layout,
// page, any nested component) constructs its own client from the same
// cookies. If the access token has expired, those separate instances can
// each try to refresh using the same (single-use, rotating) refresh token
// at the same moment — only one succeeds, the rest get rejected/rate-limited
// by Supabase auth. Reusing one instance per request means only one refresh
// ever happens.
export const createSupabaseServerClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookieOptions: {
        maxAge: 24 * 60 * 60,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't set cookies; middleware/route handlers can.
          }
        },
      },
    },
  );
});
