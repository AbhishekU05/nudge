/*
 * sends feedback from user to server
 */
"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { sendFeedbackEmail } from "@/lib/email/send-feedback";

// main function
export async function submitFeedback(formData: FormData) {
  const user = await requireUser();
  const message = formData.get("message");

  if (typeof message !== "string" || message.trim().length === 0) {
    redirect("/feedback?error=Feedback+message+is+required.");
  }

  if (message.length > 2000) {
    redirect("/feedback?error=Feedback+message+is+too+long.");
  }

  try {
    await sendFeedbackEmail({
      userEmail: user.email ?? "unknown@user.com",
      message: message.trim(),
    });
  } catch (error) {
    redirect(
      `/feedback?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to send feedback.",
      )}`,
    );
  }

  redirect("/dashboard?success=Thank+you+for+your+feedback!");
}
