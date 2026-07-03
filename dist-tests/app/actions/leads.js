"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemainingLifetimeSpots = void 0;
exports.captureLead = captureLead;
exports.captureLifetimeDealLead = captureLifetimeDealLead;
const server_1 = require("@/lib/supabase/server");
const admin_1 = require("@/lib/supabase/admin");
const cache_1 = require("next/cache");
async function captureLead(email) {
    const supabase = await (0, server_1.createSupabaseServerClient)();
    // Attempt to insert the lead. If it fails (e.g. table doesn't exist yet, or duplicate), we just ignore and continue
    // so the user experience isn't blocked.
    try {
        await supabase.from("leads").insert([{ email: email.toLowerCase() }]);
    }
    catch (err) {
        console.error("Error capturing lead:", err);
    }
}
async function captureLifetimeDealLead(email) {
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    try {
        const { error } = await supabase.from("leads").upsert([{
                email: email.toLowerCase(),
                referral_source: 'lifetime_deal'
            }], { onConflict: 'email' });
        if (error) {
            console.error("Error capturing lifetime lead:", error);
            return { success: false, error: 'unknown' };
        }
        (0, cache_1.revalidatePath)('/', 'layout');
        return { success: true };
    }
    catch (err) {
        console.error("Error capturing lifetime lead:", err);
        return { success: false, error: 'unknown' };
    }
}
const cache_2 = require("next/cache");
exports.getRemainingLifetimeSpots = (0, cache_2.unstable_cache)(async () => {
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    const maxSpots = 10;
    try {
        const { count, error } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('referral_source', 'lifetime_deal');
        if (error) {
            console.error("Error fetching remaining spots:", error);
            return maxSpots;
        }
        const spotsLeft = Math.max(0, maxSpots - (count || 0));
        return spotsLeft;
    }
    catch (err) {
        console.error("Error fetching remaining spots:", err);
        return maxSpots;
    }
}, ['lifetime-spots'], { revalidate: 3600, tags: ['lifetime-spots'] } // Cache for 1 hour or until revalidated
);
