"use strict";
/*
 * sends feedback from user to server
 */
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitFeedback = submitFeedback;
const navigation_1 = require("next/navigation");
const auth_1 = require("@/lib/auth");
const send_feedback_1 = require("@/lib/email/send-feedback");
const server_1 = require("@/lib/supabase/server");
// main function
async function submitFeedback(formData) {
    const user = await (0, auth_1.requireUser)();
    const message = formData.get("message");
    if (typeof message !== "string" || message.trim().length === 0) {
        (0, navigation_1.redirect)("/feedback?error=Feedback+message+is+required.");
    }
    if (message.length > 2000) {
        (0, navigation_1.redirect)("/feedback?error=Feedback+message+is+too+long.");
    }
    const supabase = await (0, server_1.createSupabaseServerClient)();
    let organizationName = "Unknown Organization";
    let organizationId = "Unknown ID";
    const { data: memberData } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();
    if (memberData?.organization_id) {
        organizationId = memberData.organization_id;
        const { data: orgData } = await supabase
            .from("organizations")
            .select("name")
            .eq("id", organizationId)
            .maybeSingle();
        if (orgData?.name) {
            organizationName = orgData.name;
        }
    }
    const enrichedMessage = `${message.trim()}\n\n---\nTenant Context:\nOrganization Name: ${organizationName}\nOrganization ID: ${organizationId}`;
    try {
        await (0, send_feedback_1.sendFeedbackEmail)({
            userEmail: user.email ?? "unknown@user.com",
            message: enrichedMessage,
        });
    }
    catch (error) {
        (0, navigation_1.redirect)(`/feedback?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to send feedback.")}`);
    }
    (0, navigation_1.redirect)("/dashboard?success=Thank+you+for+your+feedback!");
}
