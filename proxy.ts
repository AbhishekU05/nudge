import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isMissingEnvironmentVariableError } from "@/lib/env";
import { getSafeNextPath } from "@/lib/paths";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/auth/callback",
  "/unsubscribe",
];

const PASS_THROUGH_ROUTES = ["/", "/auth/callback", "/unsubscribe"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const nextPath = `${path}${request.nextUrl.search}`;
  const isPublic = PUBLIC_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
  const shouldBypassSessionLookup = PASS_THROUGH_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );

  if (shouldBypassSessionLookup) {
    return NextResponse.next();
  }

  try {
    const { supabase, response } = createSupabaseMiddlewareClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isPublic) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", nextPath);
      return NextResponse.redirect(loginUrl);
    }

    if (user && (path === "/login" || path === "/signup")) {
      const requestedNext = getSafeNextPath(request.nextUrl.searchParams.get("next"));
      return NextResponse.redirect(new URL(requestedNext, request.url));
    }

    return response;
  } catch (error) {
    if (isMissingEnvironmentVariableError(error)) {
      return new NextResponse(error.message, {
        status: 503,
        headers: {
          "content-type": "text/plain; charset=utf-8",
        },
      });
    }

    throw error;
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
