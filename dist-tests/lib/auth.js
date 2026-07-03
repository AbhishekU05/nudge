"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireUser = exports.getUser = void 0;
require("server-only");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const server_1 = require("@/lib/supabase/server");
exports.getUser = (0, react_1.cache)(async () => {
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: { user }, } = await supabase.auth.getUser();
    return user ?? null;
});
exports.requireUser = (0, react_1.cache)(async () => {
    const user = await (0, exports.getUser)();
    if (!user)
        (0, navigation_1.redirect)("/login");
    return user;
});
exports.requireAdmin = (0, react_1.cache)(async () => {
    const user = await (0, exports.requireUser)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();
    if (!profile?.is_admin) {
        (0, navigation_1.redirect)("/dashboard");
    }
    return user;
});
