"use server";

import { requireAdmin } from "@/lib/auth";
import { sendWeeklyDigestEmails } from "@/lib/email/send-digest";
import { revalidatePath } from "next/cache";

export async function testDigestEmail() {
  const user = await requireAdmin();
  
  const result = await sendWeeklyDigestEmails(user.id);
  
  if (result.success) {
    console.log(`Sent ${result.count} digest emails.`);
  } else {
    console.error("Failed to send digest emails", result.error);
  }
  
  revalidatePath("/admin");
}
