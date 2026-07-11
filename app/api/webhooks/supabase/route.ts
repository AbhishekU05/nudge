import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET}`) {
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
