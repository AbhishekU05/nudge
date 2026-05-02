"use server";

import { redirect } from "next/navigation";

import { sendFeedbackEmail } from "@/lib/email/send-feedback";

export async function submitSupport(formData: FormData) {
  const email = formData.get("email");
  const message = formData.get("message");

  if (typeof email !== "string" || email.trim().length === 0 || !email.includes("@")) {
    redirect("/support?error=A+valid+email+is+required.");
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    redirect("/support?error=Message+is+required.");
  }

  if (message.length > 2000) {
    redirect("/support?error=Message+is+too+long.");
  }

  try {
    await sendFeedbackEmail({
      userEmail: email.trim(),
      message: message.trim(),
    });
  } catch (error) {
    redirect(
      `/support?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to send message.",
      )}`,
    );
  }

  redirect("/support?success=Thank+you!+We+will+get+back+to+you+shortly.");
}
