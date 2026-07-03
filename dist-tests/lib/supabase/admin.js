"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseAdminClient = createSupabaseAdminClient;
require("server-only");
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("@/lib/env");
function createSupabaseAdminClient() {
    return (0, supabase_js_1.createClient)((0, env_1.getSupabaseUrl)(), (0, env_1.getRequiredEnv)("SUPABASE_SERVICE_ROLE_KEY"), {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}
