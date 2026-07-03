"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseMiddlewareClient = createSupabaseMiddlewareClient;
const ssr_1 = require("@supabase/ssr");
const server_1 = require("next/server");
const env_1 = require("@/lib/env");
function createSupabaseMiddlewareClient(request) {
    const response = server_1.NextResponse.next({
        request: {
            headers: request.headers,
        },
    });
    const supabase = (0, ssr_1.createServerClient)((0, env_1.getSupabaseUrl)(), (0, env_1.getSupabasePublishableKey)(), {
        cookieOptions: {
            maxAge: 24 * 60 * 60,
        },
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                for (const { name, value, options } of cookiesToSet) {
                    request.cookies.set(name, value);
                    response.cookies.set(name, value, options);
                }
            },
        },
    });
    return { supabase, response };
}
