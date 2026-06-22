import "server-only";

import { getResendClient } from "@/lib/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDaysOverdue } from "@/lib/types";
import { logger } from "@/lib/logger";

export async function sendWeeklyDigestEmails() {
  const supabase = createSupabaseAdminClient();
  const resend = getResendClient();

  // Fetch all active invoices with remaining balance
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("*")
    .eq("active", true)
    .gt("amount_owed", 0);

  if (invoicesError || !invoices) {
    logger.error({ message: "Failed to fetch invoices for digest", error: invoicesError, context: "sendWeeklyDigestEmails" });
    return { success: false, error: invoicesError };
  }

  // Filter only those that still have a balance > 0
  const outstandingInvoices = invoices.filter(inv => {
    const remaining = Number(inv.amount_owed) - Number(inv.amount_paid);
    return remaining > 0;
  });

  if (outstandingInvoices.length === 0) {
    return { success: true, count: 0 };
  }

  // Group by user_id
  const invoicesByUser = outstandingInvoices.reduce((acc, inv) => {
    if (!acc[inv.user_id]) acc[inv.user_id] = [];
    acc[inv.user_id].push(inv);
    return acc;
  }, {} as Record<string, typeof outstandingInvoices>);

  // Fetch all users to get their emails
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError || !usersData) {
    logger.error({ message: "Failed to fetch users for digest", error: usersError, context: "sendWeeklyDigestEmails" });
    return { success: false, error: usersError };
  }

  const userMap = usersData.users.reduce((acc, user) => {
    if (user.email) {
      acc[user.id] = user.email;
    }
    return acc;
  }, {} as Record<string, string>);

  let emailsSent = 0;

  for (const [userId, userInvoices] of Object.entries(invoicesByUser)) {
    const userEmail = userMap[userId];
    if (!userEmail) continue;

    // Create the HTML summary
    let htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Your Weekly Invoice Digest</h2>
        <p>Here is a snapshot of your currently outstanding invoices:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid #eee; text-align: left;">
              <th style="padding: 10px;">Invoice #</th>
              <th style="padding: 10px;">Due Date</th>
              <th style="padding: 10px;">Remaining</th>
              <th style="padding: 10px;">Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    (userInvoices as any[]).forEach(inv => {
      const remaining = Number(inv.amount_owed) - Number(inv.amount_paid);
      const isOverdue = getDaysOverdue(inv as any) !== null;
      const statusColor = isOverdue ? "#e53e3e" : "#d69e2e";
      const statusText = isOverdue ? "Overdue" : "Outstanding";
      
      htmlContent += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px;">${inv.invoice_number || 'N/A'}</td>
          <td style="padding: 10px;">${inv.due_date || 'N/A'}</td>
          <td style="padding: 10px;">${inv.currency} ${remaining.toFixed(2)}</td>
          <td style="padding: 10px; color: ${statusColor}; font-weight: bold;">${statusText}</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          Login to your dashboard to manage these invoices and send follow-ups.
        </p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: "snapshot@duely.in",
        to: userEmail,
        subject: "Weekly Invoice Digest - Duely",
        html: htmlContent,
      });
      emailsSent++;
    } catch (err) {
      logger.error({ message: `Failed to send digest to ${userEmail}`, error: err, context: "sendWeeklyDigestEmails" });
    }
  }

  return { success: true, count: emailsSent };
}
