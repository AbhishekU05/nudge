import "server-only";

import { getResendClient, getFromEmail } from "@/lib/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDaysOverdue } from "@/lib/types";
import { logger } from "@/lib/logger";
import { hasGmailTokens, sendGmail } from "@/lib/gmail";
import { render } from "@react-email/render";
import { WeeklyDigestEmail } from "@/components/emails/WeeklyDigest";

export async function sendWeeklyDigestEmails(targetUserId?: string) {
  const supabase = createSupabaseAdminClient();
  const resend = getResendClient();

  // 1. Fetch profiles
  let profilesQuery = supabase
    .from("profiles")
    .select("user_id, timezone, weekly_digest_enabled");

  if (targetUserId) {
    profilesQuery = profilesQuery.eq("user_id", targetUserId);
  } else {
    profilesQuery = profilesQuery.eq("weekly_digest_enabled", true);
  }

  const { data: profiles, error: profilesError } = await profilesQuery;

  if (profilesError || !profiles) {
    logger.error({ message: "Failed to fetch profiles for digest", error: profilesError, context: "sendWeeklyDigestEmails" });
    return { success: false, error: profilesError };
  }

  // 2. Filter profiles by current time (only if NOT manually triggered)
  const now = new Date();
  const eligibleProfiles = profiles.filter(profile => {
    if (targetUserId) return true; // manual trigger bypasses time check

    try {
      const tz = profile.timezone || "UTC";
      const formatter = new Intl.DateTimeFormat('en-US', { 
        timeZone: tz, 
        weekday: 'short', 
        hour: 'numeric', 
        hour12: false 
      });
      const formatted = formatter.format(now);
      // e.g. "Mon, 08" or "Mon, 8"
      return formatted.startsWith("Mon") && (formatted.includes("08") || formatted.endsWith(" 8"));
    } catch (e) {
      return false;
    }
  });

  if (eligibleProfiles.length === 0) {
    return { success: true, count: 0 };
  }

  // 3. Fetch users for their emails
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError || !usersData) {
    logger.error({ message: "Failed to fetch users for digest", error: usersError, context: "sendWeeklyDigestEmails" });
    return { success: false, error: usersError };
  }
  const userMap = usersData.users.reduce((acc, user) => {
    if (user.email) acc[user.id] = user.email;
    return acc;
  }, {} as Record<string, string>);

  let emailsSent = 0;

  // 4. Process each eligible profile
  for (const profile of eligibleProfiles) {
    const userId = profile.user_id;
    const userEmail = userMap[userId];
    if (!userEmail) continue;

    // Fetch invoices
    const { data: invoices, error: invError } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", userId);

    if (invError || !invoices) continue;

    // Fetch payments in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: events } = await supabase
      .from("customer_events")
      .select("*, invoices(recipient_name)")
      .eq("user_id", userId)
      .eq("event_type", "payment")
      .gte("created_at", sevenDaysAgo.toISOString());

    // Calculate metrics and populate lists
    let totalOut = 0;
    let totalOver = 0;
    let overdueCount = 0;
    
    const overdueInvoicesList: any[] = [];
    const upcomingInvoicesList: any[] = [];
    const promisesThisWeekList: any[] = [];
    const paymentsReceivedList: any[] = [];
    const actionItemsList: string[] = [];

    const agingBuckets = { "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };

    invoices.forEach(inv => {
      const remaining = Number(inv.amount_owed) - Number(inv.amount_paid);
      if (!inv.active || remaining <= 0) return;

      const currency = inv.currency || "USD";
      totalOut += remaining;

      const daysOverdue = getDaysOverdue(inv as any);
      
      if (daysOverdue !== null) {
        totalOver += remaining;
        overdueCount++;

        // Aging
        if (daysOverdue <= 30) agingBuckets["1-30"] += remaining;
        else if (daysOverdue <= 60) agingBuckets["31-60"] += remaining;
        else if (daysOverdue <= 90) agingBuckets["61-90"] += remaining;
        else agingBuckets["90+"] += remaining;

        overdueInvoicesList.push({
          clientName: inv.recipient_name || "Unknown",
          amount: `${currency} ${remaining.toFixed(2)}`,
          daysOverdue: daysOverdue,
          lastContact: inv.last_sent_at ? new Date(inv.last_sent_at).toLocaleDateString() : undefined
        });

        // Action items (e.g. if > 15 days overdue)
        if (daysOverdue > 15 && overdueInvoicesList.length <= 5) {
          actionItemsList.push(`Follow up with ${inv.recipient_name || "Unknown"} on ${currency} ${remaining.toFixed(2)} (${daysOverdue} days overdue)`);
        }
      } else if (inv.due_date) {
        // Upcoming in next 14 days?
        const due = new Date(inv.due_date);
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 14) {
          upcomingInvoicesList.push({
            clientName: inv.recipient_name || "Unknown",
            amount: `${currency} ${remaining.toFixed(2)}`,
            dueInDays: diffDays
          });
        }
      }

      // Promises due this week
      if (inv.workflow_status === "promised" && inv.promised_date) {
        const promiseDate = new Date(inv.promised_date);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        if (promiseDate >= now && promiseDate <= nextWeek) {
           promisesThisWeekList.push({
             clientName: inv.recipient_name || "Unknown",
             amount: `${currency} ${remaining.toFixed(2)}`,
             dueDate: promiseDate.toLocaleDateString()
           });
        }
      }
    });

    // Payments received
    if (events) {
      events.forEach(ev => {
        const clientName = ev.invoices?.recipient_name || "Unknown";
        paymentsReceivedList.push({
          clientName,
          amount: `${ev.currency || "USD"} ${Number(ev.amount).toFixed(2)}`,
          date: new Date(ev.created_at).toLocaleDateString()
        });
      });
    }

    // Sort upcoming by days due asc
    upcomingInvoicesList.sort((a, b) => a.dueInDays - b.dueInDays);
    overdueInvoicesList.sort((a, b) => b.daysOverdue - a.daysOverdue);

    // Render React Email
    const dateRange = `${sevenDaysAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`;
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }); // rough estimate
    
    try {
      const htmlContent = await render(
        WeeklyDigestEmail({
          dateRange,
          totalOutstanding: formatter.format(totalOut),
          totalOverdue: formatter.format(totalOver),
          overdueCount,
          overdueInvoices: overdueInvoicesList,
          upcomingInvoices: upcomingInvoicesList,
          promisesThisWeek: promisesThisWeekList,
          paymentsReceived: paymentsReceivedList,
          agingBuckets,
          actionItems: actionItemsList
        })
      );

      const subject = "Your weekly collections snapshot";

      // Attempt to send via connected Gmail, else fallback
      const hasGmail = await hasGmailTokens(userId);
      if (hasGmail) {
        await sendGmail({
          userId,
          senderName: "Duely Snapshot",
          senderEmail: userEmail,
          to: userEmail,
          subject,
          body: htmlContent,
          html: true
        });
      } else {
        await resend.emails.send({
          from: getFromEmail(), // uses standard noreply@duely.in or whatever is configured
          to: userEmail,
          subject,
          html: htmlContent,
        });
      }

      emailsSent++;
    } catch (err) {
      logger.error({ message: `Failed to send digest to ${userEmail}`, error: err, context: "sendWeeklyDigestEmails", user_id: userId });
    }
  }

  return { success: true, count: emailsSent };
}
