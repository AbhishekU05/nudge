import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("organizations")
      .select("*", { count: "exact", head: true })
      .limit(1);

    if (error) {
      console.error("Health check failed:", error.message);
      return NextResponse.json({ status: "error", message: "Database check failed" }, { status: 500 });
    }

    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    console.error("Health check failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ status: "error", message: "Database check failed" }, { status: 500 });
  }
}
