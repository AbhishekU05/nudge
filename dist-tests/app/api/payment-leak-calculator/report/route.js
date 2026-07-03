"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const react_1 = require("react");
const zod_1 = require("zod");
const payment_leak_report_1 = require("@/emails/payment-leak-report");
const reminder_1 = require("@/lib/email/reminder");
const calculations_1 = require("@/lib/payment-leak-calculator/calculations");
const pdf_1 = require("@/lib/payment-leak-calculator/pdf");
const resend_1 = require("@/lib/resend");
const admin_1 = require("@/lib/supabase/admin");
const reportSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email(),
    inputs: zod_1.z.object({
        activeClients: zod_1.z.coerce.number().int().min(1).max(200),
        averageInvoiceValue: zod_1.z.coerce.number().min(0).max(100000000),
        latePaymentPercentage: zod_1.z.coerce.number().min(0).max(100),
        monthlyOperatingExpenses: zod_1.z.coerce.number().min(0).max(100000000).nullable().optional(),
        paymentDelayDays: zod_1.z.coerce.number().min(0).max(180),
    }),
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
        return Response.json({ error: "Please provide a valid name, email, and calculator inputs." }, { status: 400 });
    }
    const { email, name } = parsed.data;
    const inputs = {
        ...parsed.data.inputs,
        monthlyOperatingExpenses: parsed.data.inputs.monthlyOperatingExpenses &&
            parsed.data.inputs.monthlyOperatingExpenses > 0
            ? parsed.data.inputs.monthlyOperatingExpenses
            : null,
    };
    const results = (0, calculations_1.calculatePaymentLeak)(inputs);
    let insertSucceeded = false;
    try {
        const supabase = (0, admin_1.createSupabaseAdminClient)();
        const { error: insertError } = await supabase
            .from("payment_leak_calculator_leads")
            .insert({
            active_clients: inputs.activeClients,
            annual_impact: results.annualImpact,
            average_invoice_value: inputs.averageInvoiceValue,
            cash_tied_up: results.cashTiedUp,
            client_concentration_score: results.clientConcentrationScore,
            delay_days_score: results.delayDaysScore,
            email: email.toLowerCase(),
            late_payment_percentage: inputs.latePaymentPercentage,
            late_payment_score: results.latePaymentScore,
            monthly_operating_expenses: inputs.monthlyOperatingExpenses,
            name,
            operating_expense_coverage: results.operatingExpenseCoverage,
            payment_delay_days: inputs.paymentDelayDays,
            recommendations: results.recommendations,
            risk_level: results.riskLevel,
            risk_score: results.riskScore,
            source: parsed.data.source || null,
            utm_source: parsed.data.utm_source || null,
            utm_medium: parsed.data.utm_medium || null,
            utm_campaign: parsed.data.utm_campaign || null,
        });
        if (insertError) {
            console.error("Payment leak lead insert failed:", insertError);
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
        const pdf = (0, pdf_1.buildPaymentLeakReportPdf)({ email, inputs, name, results });
        const resend = (0, resend_1.getResendClient)();
        const response = await resend.emails.send({
            attachments: [
                {
                    content: pdf.toString("base64"),
                    filename: "duely-collections-report.pdf",
                },
            ],
            from: (0, resend_1.getFromEmail)(),
            react: (0, react_1.createElement)(payment_leak_report_1.PaymentLeakReportEmail, {
                appUrl: (0, reminder_1.getAppUrl)(),
                name,
                results,
            }),
            subject: "Your Duely collections report",
            text: `Hi ${name},\n\nYour Duely collections report is attached.\n\nCash tied up: ${results.cashTiedUp}\nAnnual impact: ${results.annualImpact}\nRisk score: ${results.riskScore}/100`,
            to: email,
        });
        if (response.error) {
            console.error("Payment leak report email failed:", response.error);
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
