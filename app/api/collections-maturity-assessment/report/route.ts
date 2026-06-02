import { createElement } from "react";
import { z } from "zod";

import { CollectionsMaturityReportEmail } from "@/emails/collections-maturity-report";
import { getAppUrl } from "@/lib/email/reminder";
import {
  calculateMaturity,
  QUESTIONS,
  type MaturityInputs,
} from "@/lib/collections-maturity/calculations";
import { buildMaturityReportPdf } from "@/lib/collections-maturity/pdf";
import { getFromEmail, getResendClient } from "@/lib/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const answersSchema = z.record(z.string(), z.coerce.number().int().min(0).max(5));

const reportSchema = z.object({
  email: z.string().trim().email(),
  answers: answersSchema,
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
      { error: "Please provide a valid name, email, and assessment answers." },
      { status: 400 },
    );
  }

  const { email, name, answers } = parsed.data;

  // Validate all questions answered
  const missingQuestions = QUESTIONS.filter((q) => answers[q.id] === undefined);
  if (missingQuestions.length > 0) {
    return Response.json(
      { error: "Please answer all assessment questions." },
      { status: 400 },
    );
  }

  const results = calculateMaturity(answers as MaturityInputs);

  let insertSucceeded = false;

  try {
    const supabase = createSupabaseAdminClient();

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
    } else {
      insertSucceeded = true;
    }

    await supabase.from("leads").upsert({ email: email.toLowerCase() }, { onConflict: "email" });
  } catch (dbError) {
    console.error("Database operation failed:", dbError);
  }

  try {
    const pdf = buildMaturityReportPdf({ email, name, results });
    const resend = getResendClient();
    const response = await resend.emails.send({
      attachments: [
        {
          content: pdf.toString("base64"),
          filename: "duely-maturity-report.pdf",
        },
      ],
      from: getFromEmail(),
      react: createElement(CollectionsMaturityReportEmail, {
        appUrl: getAppUrl(),
        name,
        results,
      }),
      subject: "Your Duely collections maturity report",
      text: `Hi ${name},\n\nYour Duely collections maturity report is attached.\n\nOverall score: ${results.overallScore}/100\nLevel: ${results.level}\nWeakest area: ${results.weakest.label}`,
      to: email,
    });

    if (response.error) {
      console.error("Maturity report email failed:", response.error);
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
