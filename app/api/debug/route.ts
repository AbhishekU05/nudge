import { NextResponse } from "next/server";
import { syncXeroInvoicesForUser } from "@/lib/xero";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const result = await syncXeroInvoicesForUser(userId);
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("DEBUG SYNC ERROR", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
