"use server";

import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/abuse";
import { getResendClient } from "@/lib/resend";
import { headers } from "next/headers";

// Very simple in-memory IP rate limiting
// In a serverless environment, this is per-instance, but provides a basic layer of protection.
const ipRateLimitMap = new Map<string, { count: number; timestamp: number }>();

export async function submitFeedback(formData: FormData) {
  const user = await requireUser();
  const message = formData.get("message");

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    throw new Error("Message is required");
  }

  // 1. IP Rate Limiting
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0] : "unknown";

  if (ip !== "unknown") {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 3;

    const record = ipRateLimitMap.get(ip);
    if (record) {
      if (now - record.timestamp < windowMs) {
        if (record.count >= maxRequests) {
          throw new Error("Too many requests from this IP. Please try again later.");
        }
        record.count += 1;
      } else {
        record.count = 1;
        record.timestamp = now;
      }
    } else {
      ipRateLimitMap.set(ip, { count: 1, timestamp: now });
    }
  }

  // 2. Account Rate Limiting (persisted to DB)
  await enforceRateLimit(user.id, "feedback_submit");

  // 3. Send email via Resend
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: "feedback@duely.in",
    to: "feedback@duely.in",
    subject: `Feedback from ${user.email}`,
    text: `User ID: ${user.id}\nUser Email: ${user.email}\n\nMessage:\n${message}`,
    replyTo: user.email,
  });

  if (error) {
    console.error("Error sending feedback email", error);
    throw new Error("Failed to send feedback. Please try again.");
  }
}
