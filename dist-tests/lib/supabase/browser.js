"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseBrowserClient = createSupabaseBrowserClient;
const ssr_1 = require("@supabase/ssr");
const env_1 = require("@/lib/env");
function createSupabaseBrowserClient() {
    return (0, ssr_1.createBrowserClient)((0, env_1.getSupabaseUrl)(), (0, env_1.getSupabasePublishableKey)(), {
        cookieOptions: {
            maxAge: 24 * 60 * 60,
        },
    });
}
