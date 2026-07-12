import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { inngest } from "@/lib/inngest/client";

function isAuthorized(authHeader: string | null) {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;

  // Fail closed. The previous check interpolated the secret straight into a
  // template literal, so a missing env var turned the expected value into the
  // string "Bearer undefined" - which any caller could simply send.
  if (!secret) {
    console.error("SUPABASE_WEBHOOK_SECRET is not configured; rejecting webhook");
    return false;
  }
  if (!authHeader) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authHeader);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req.headers.get("authorization"))) {
      console.error("Unauthorized Supabase Webhook Attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();

    // Ensure it's an insert event for an invoice
    if (payload.type === "INSERT" && payload.table === "invoices" && payload.record) {
      const { id, organization_id, status } = payload.record;

      if (status !== "paid" && status !== "written_off") {
        await inngest.send({
          name: "invoice.evaluate_late_fee",
          data: {
            invoiceId: id,
            organizationId: organization_id,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err as Error;
    console.error("Supabase webhook error:", error.message);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}
