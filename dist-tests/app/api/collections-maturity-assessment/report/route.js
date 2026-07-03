"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const react_1 = require("react");
const zod_1 = require("zod");
const collections_maturity_report_1 = require("@/emails/collections-maturity-report");
const reminder_1 = require("@/lib/email/reminder");
const calculations_1 = require("@/lib/collections-maturity/calculations");
const pdf_1 = require("@/lib/collections-maturity/pdf");
const resend_1 = require("@/lib/resend");
const admin_1 = require("@/lib/supabase/admin");
const answersSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.coerce.number().int().min(0).max(5));
const reportSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email(),
    answers: answersSchema,
    name: zod_1.z.string().trim().min(2).max(120),
    source: zod_1.z.string().max(200).nullish(),
    utm_source: zod_1.z.string().max(200).nullish(),
    utm_medium: zod_1.z.string().max(200).nullish(),
    utm_campaign: zod_1.z.string().max(200).nullish(),
});
async function POST(request) {
    let body;
    try {
        body = await request.json();
    }
    catch {
        return Response.json({ error: "Invalid request body." }, { status: 400 });
    }
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
        return Response.json({ error: "Please provide a valid name, email, and assessment answers." }, { status: 400 });
    }
    const { email, name, answers } = parsed.data;
    // Validate all questions answered
    const missingQuestions = calculations_1.QUESTIONS.filter((q) => answers[q.id] === undefined);
    if (missingQuestions.length > 0) {
        return Response.json({ error: "Please answer all assessment questions." }, { status: 400 });
    }
    const results = (0, calculations_1.calculateMaturity)(answers);
    let insertSucceeded = false;
    try {
        const supabase = (0, admin_1.createSupabaseAdminClient)();
        const followUp = results.categories.find((c) => c.key === "followUpDiscipline");
        const promise = results.categories.find((c) => c.key === "promiseTracking");
        const visibility = results.categories.find((c) => c.key === "visibility");
        const automation = results.categories.find((c) => c.key === "automation");
        const { error: insertError } = await supabase
            .from("collections_maturity_leads")
            .insert({
            name,
            email: email.toLowerCase(),
            overall_score: results.overallScore,
            level: results.level,
            follow_up_discipline_score: followUp?.percentage ?? 0,
            promise_tracking_score: promise?.percentage ?? 0,
            visibility_score: visibility?.percentage ?? 0,
            automation_score: automation?.percentage ?? 0,
            weakest_category: results.weakest.label,
            strongest_category: results.strongest.label,
            recommendations: results.recommendations,
            source: parsed.data.source || null,
            utm_source: parsed.data.utm_source || null,
            utm_medium: parsed.data.utm_medium || null,
            utm_campaign: parsed.data.utm_campaign || null,
        });
        if (insertError) {
            console.error("Maturity lead insert failed:", insertError);
        }
        else {
            insertSucceeded = true;
        }
        await supabase.from("leads").upsert({ email: email.toLowerCase() }, { onConflict: "email" });
    }
    catch (dbError) {
        console.error("Database operation failed:", dbError);
    }
    try {
        const pdf = (0, pdf_1.buildMaturityReportPdf)({ email, name, results });
        const resend = (0, resend_1.getResendClient)();
        const response = await resend.emails.send({
            attachments: [
                {
                    content: pdf.toString("base64"),
                    filename: "duely-maturity-report.pdf",
                },
            ],
            from: (0, resend_1.getFromEmail)(),
            react: (0, react_1.createElement)(collections_maturity_report_1.CollectionsMaturityReportEmail, {
                appUrl: (0, reminder_1.getAppUrl)(),
                name,
                results,
            }),
            subject: "Your Duely collections maturity report",
            text: `Hi ${name},\n\nYour Duely collections maturity report is attached.\n\nOverall score: ${results.overallScore}/100\nLevel: ${results.level}\nWeakest area: ${results.weakest.label}`,
            to: email,
        });
        if (response.error) {
            console.error("Maturity report email failed:", response.error);
            return Response.json({
                error: insertSucceeded
                    ? "Your report was saved, but the email could not be sent. Please try again."
                    : "We could not send your report. Please try again.",
            }, { status: 502 });
        }
    }
    catch (emailError) {
        console.error("Email sending threw:", emailError);
        return Response.json({ error: "We could not send your report. Please try again." }, { status: 502 });
    }
    return Response.json({ ok: true });
}
