"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
/*
 * Supabase auth requests and validation
 */
const headers_1 = require("next/headers");
const server_1 = require("next/server");
const auth_errors_1 = require("@/lib/auth-errors");
const paths_1 = require("@/lib/paths");
const admin_1 = require("@/lib/supabase/admin");
const server_2 = require("@/lib/supabase/server");
// decide where to send user if auth fails
function getAuthErrorRedirectPath(message, nextPath) {
    if (nextPath === "/reset-password") {
        return (0, paths_1.buildPathWithQuery)("/forgot-password", {
            error: (0, auth_errors_1.getEmailLinkErrorMessage)(message),
        });
    }
    return (0, paths_1.buildPathWithQuery)("/login", {
        error: message,
        next: nextPath !== "/dashboard" ? nextPath : null,
    });
}
// auth callback endpoint
async function GET(request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const nextPath = (0, paths_1.getSafeNextPath)(url.searchParams.get("next"));
    const authError = url.searchParams.get("error_description");
    if (authError) {
        return server_1.NextResponse.redirect(new URL(getAuthErrorRedirectPath("Something went wrong. Please try again.", nextPath), url.origin));
    }
    if (!code) {
        return server_1.NextResponse.redirect(new URL(getAuthErrorRedirectPath("Something went wrong. Please try again.", nextPath), url.origin));
    }
    const supabase = await (0, server_2.createSupabaseServerClient)();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
        return server_1.NextResponse.redirect(new URL(getAuthErrorRedirectPath("Something went wrong. Please try again.", nextPath), url.origin));
    }
    const cookieStore = await (0, headers_1.cookies)();
    const referralSource = cookieStore.get("nudge_referral")?.value;
    if (referralSource && data.user) {
        const adminSupabase = (0, admin_1.createSupabaseAdminClient)();
        await adminSupabase
            .from("profiles")
            .update({ referral_source: referralSource })
            .eq("user_id", data.user.id)
            .is("referral_source", null);
    }
    return server_1.NextResponse.redirect(new URL(nextPath, url.origin));
}
