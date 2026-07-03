"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseServerClient = createSupabaseServerClient;
require("server-only");
const ssr_1 = require("@supabase/ssr");
const headers_1 = require("next/headers");
const env_1 = require("@/lib/env");
async function createSupabaseServerClient() {
    const cookieStore = await (0, headers_1.cookies)();
    return (0, ssr_1.createServerClient)((0, env_1.getSupabaseUrl)(), (0, env_1.getSupabasePublishableKey)(), {
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
                }
                catch {
                    // Server Components can't set cookies; middleware/route handlers can.
                }
            },
        },
    });
}
