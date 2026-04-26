import { NextResponse } from "next/server";

import { buildPathWithQuery, getSafeNextPath } from "@/lib/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = getSafeNextPath(url.searchParams.get("next"));
  const authError = url.searchParams.get("error_description");

  if (authError) {
    return NextResponse.redirect(
      new URL(
        buildPathWithQuery("/login", {
          error: authError,
          next: nextPath !== "/dashboard" ? nextPath : null,
        }),
        url.origin,
      ),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        buildPathWithQuery("/login", {
          error: "Missing authentication code.",
          next: nextPath !== "/dashboard" ? nextPath : null,
        }),
        url.origin,
      ),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        buildPathWithQuery("/login", {
          error: error.message,
          next: nextPath !== "/dashboard" ? nextPath : null,
        }),
        url.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
