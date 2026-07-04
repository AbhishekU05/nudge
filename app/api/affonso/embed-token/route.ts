import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();

    const apiKey = process.env.AFFONSO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Affiliate program not configured" }, { status: 503 });
    }

    const res = await fetch("https://api.affonso.io/v1/embed/token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        programId: "cmr3tysca000xltgmzylwzqz7",
        partner: {
          email: user.email!,
          name: user.user_metadata?.full_name || user.email!.split("@")[0],
        },
        externalUserId: user.id,
      }),
    });

    if (!res.ok) {
      logger.error({
        message: `Affonso embed token request failed: ${res.status}`,
        context: "affonso:embed-token",
      });
      return NextResponse.json({ error: "Something went wrong" }, { status: 502 });
    }

    const json = await res.json();
    const token = json?.data?.publicToken;

    if (!token) {
      logger.error({ message: "Affonso embed token missing in response", context: "affonso:embed-token" });
      return NextResponse.json({ error: "Something went wrong" }, { status: 502 });
    }

    return NextResponse.json({ token });
  } catch (err) {
    logger.error({ message: `Affonso embed token error: ${String(err)}`, context: "affonso:embed-token" });
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
