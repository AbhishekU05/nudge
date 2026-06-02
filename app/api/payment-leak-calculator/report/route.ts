import { createElement } from "react";
import { z } from "zod";

import { PaymentLeakReportEmail } from "@/emails/payment-leak-report";
import { getAppUrl } from "@/lib/email/reminder";
import {
  calculatePaymentLeak,
  type PaymentLeakInputs,
} from "@/lib/payment-leak-calculator/calculations";
import { buildPaymentLeakReportPdf } from "@/lib/payment-leak-calculator/pdf";
import { getFromEmail, getResendClient } from "@/lib/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const reportSchema = z.object({
  email: z.string().trim().email(),
  inputs: z.object({
    activeClients: z.coerce.number().int().min(1).max(200),
    averageInvoiceValue: z.coerce.number().min(0).max(100000000),
    latePaymentPercentage: z.coerce.number().min(0).max(100),
    monthlyOperatingExpenses: z.coerce.number().min(0).max(100000000).nullable().optional(),
    paymentDelayDays: z.coerce.number().min(0).max(180),
  }),
  name: z.string().trim().min(2).max(120),
  source: z.string().max(200).nullish(),
  utm_source: z.string().max(200).nullish(),
  utm_medium: z.string().max(200).nullish(),
  utm_campaign: z.string().max(200).nullish(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Please provide a valid name, email, and calculator inputs." },
      { status: 400 },
    );
  }

  const { email, name } = parsed.data;
  const inputs: PaymentLeakInputs = {
    ...parsed.data.inputs,
    monthlyOperatingExpenses:
      parsed.data.inputs.monthlyOperatingExpenses &&
      parsed.data.inputs.monthlyOperatingExpenses > 0
        ? parsed.data.inputs.monthlyOperatingExpenses
        : null,
  };
  const results = calculatePaymentLeak(inputs);

  let insertSucceeded = false;

  try {
    const supabase = createSupabaseAdminClient();

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
    } else {
      insertSucceeded = true;
    }

    await supabase.from("leads").upsert({ email: email.toLowerCase() }, { onConflict: "email" });
  } catch (dbError) {
    console.error("Database operation failed:", dbError);
  }

  try {
    const pdf = buildPaymentLeakReportPdf({ email, inputs, name, results });
    const resend = getResendClient();
    const response = await resend.emails.send({
      attachments: [
        {
          content: pdf.toString("base64"),
          filename: "duely-collections-report.pdf",
        },
      ],
      from: getFromEmail(),
      react: createElement(PaymentLeakReportEmail, {
        appUrl: getAppUrl(),
        name,
        results,
      }),
      subject: "Your Duely collections report",
      text: `Hi ${name},\n\nYour Duely collections report is attached.\n\nCash tied up: ${results.cashTiedUp}\nAnnual impact: ${results.annualImpact}\nRisk score: ${results.riskScore}/100`,
      to: email,
    });

    if (response.error) {
      console.error("Payment leak report email failed:", response.error);
      return Response.json(
        {
          error: insertSucceeded
            ? "Your report was saved, but the email could not be sent. Please try again."
            : "We could not send your report. Please try again.",
        },
        { status: 502 },
      );
    }
  } catch (emailError) {
    console.error("Email sending threw:", emailError);
    return Response.json(
      { error: "We could not send your report. Please try again." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
