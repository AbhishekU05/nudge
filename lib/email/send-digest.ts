import "server-only";

import { getResendClient, getFromEmail } from "@/lib/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDaysOverdue, isEffectivelyPaid, InvoiceRecord, CustomerEvent } from "@/lib/types";
import { logger } from "@/lib/logger";
import { hasGmailTokens, sendGmail } from "@/lib/gmail";
import { render } from "@react-email/render";
import WeeklyDigestEmail from "@/components/emails/WeeklyDigest";

export type DigestRecipient = { userId: string; userEmail: string };

// A digest is due once a week. Six days (rather than seven) gives the check
// slack: a send at 08:05 last Monday must not make this Monday's 08:00 tick look
// like "only 6d23h has passed, skip" and push the digest to 09:00 every week.
const DIGEST_MIN_INTERVAL_MS = 6 * 24 * 60 * 60 * 1000;

function digestAlreadySentThisWeek(lastSentAt: string | null, now: Date) {
  if (!lastSentAt) return false;
  const lastSent = new Date(lastSentAt);
  if (Number.isNaN(lastSent.getTime())) return false;
  return now.getTime() - lastSent.getTime() < DIGEST_MIN_INTERVAL_MS;
}

// Steps 1-3: figure out who is actually due for a digest right now. Split out
// from the per-user send so the Inngest function can wrap each user's send in
// its own step - otherwise a retry after a mid-batch failure re-sends the
// digest to everyone who already got one in the failed attempt.
export async function getEligibleDigestRecipients(
  targetUserId?: string
): Promise<{ success: true; recipients: DigestRecipient[] } | { success: false; error: unknown }> {
  const supabase = createSupabaseAdminClient();

  // 1. Who opted in. The digest preference is per-user (profiles), but the
  // schedule is per-org (organizations.timezone, moved off profiles in
  // 20260710130000). profiles and organization_members both link to auth.users
  // independently and have no foreign key between them, so PostgREST cannot
  // embed one in the other - the join is done in code below.
  let profilesQuery = supabase.from("profiles").select("user_id, weekly_digest_enabled, last_digest_sent_at");

  if (targetUserId) {
    profilesQuery = profilesQuery.eq("user_id", targetUserId);
  } else {
    profilesQuery = profilesQuery.eq("weekly_digest_enabled", true);
  }

  const { data: profiles, error: profilesError } = await profilesQuery;

  if (profilesError || !profiles) {
    logger.error({ message: "Failed to fetch profiles for digest", error: profilesError, context: "getEligibleDigestRecipients" });
    return { success: false, error: profilesError };
  }

  if (profiles.length === 0) {
    return { success: true, recipients: [] };
  }

  // 2. Map each user to their org's timezone.
  const userIds = profiles.map(p => p.user_id);

  const { data: members, error: membersError } = await supabase
    .from("organization_members")
    .select("user_id, organization_id")
    .in("user_id", userIds);

  if (membersError) {
    logger.error({ message: "Failed to fetch organization members for digest", error: membersError, context: "getEligibleDigestRecipients" });
    return { success: false, error: membersError };
  }

  const orgIds = Array.from(new Set((members || []).map(m => m.organization_id)));

  const { data: organizations, error: orgsError } = orgIds.length
    ? await supabase.from("organizations").select("id, timezone").in("id", orgIds)
    : { data: [], error: null };

  if (orgsError) {
    logger.error({ message: "Failed to fetch organizations for digest", error: orgsError, context: "getEligibleDigestRecipients" });
    return { success: false, error: orgsError };
  }

  const timezoneByOrgId = new Map((organizations || []).map(o => [o.id, o.timezone as string | null]));
  const timezoneByUserId = new Map<string, string>();
  for (const member of members || []) {
    if (timezoneByUserId.has(member.user_id)) continue;
    timezoneByUserId.set(member.user_id, timezoneByOrgId.get(member.organization_id) || "UTC");
  }

  // 3. Filter by current time in the user's org timezone (manual trigger bypasses).
  //
  // The window is "Monday, 08:00 or later" rather than "exactly hour 8", paired
  // with the last_digest_sent_at guard below. The old "hour === 8" test gave the
  // job a single chance per week: one delayed or failed hourly tick and the org
  // silently lost that week's digest. Now any remaining Monday tick picks it up,
  // and the guard stops the extra ticks from sending a second copy.
  const now = new Date();
  const eligibleProfiles = profiles.filter(profile => {
    if (targetUserId) return true;

    if (digestAlreadySentThisWeek(profile.last_digest_sent_at, now)) return false;

    try {
      const tz = timezoneByUserId.get(profile.user_id) || "UTC";
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'short',
        hour: 'numeric',
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      const weekday = parts.find(p => p.type === "weekday")?.value;
      const hour = Number(parts.find(p => p.type === "hour")?.value);
      return weekday === "Mon" && hour >= 8;
    } catch {
      return false;
    }
  });

  if (eligibleProfiles.length === 0) {
    return { success: true, recipients: [] };
  }

  // 4. Look up each recipient's email directly. listUsers() paginates at 50 by
  // default, which would silently drop recipients once the org count grows.
  const recipients: DigestRecipient[] = [];
  for (const profile of eligibleProfiles) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.user_id);
    if (userError || !userData?.user?.email) {
      logger.error({ message: "Failed to fetch user for digest", error: userError, user_id: profile.user_id, context: "getEligibleDigestRecipients" });
      continue;
    }
    recipients.push({ userId: profile.user_id, userEmail: userData.user.email });
  }

  return { success: true, recipients };
}

// Step 4 for a single user. Kept separate so each call can be wrapped in its
// own Inngest step - see getEligibleDigestRecipients above for why.
// `markSent` records the send against the user's profile so the remaining hourly
// ticks that Monday skip them. Only the scheduled run sets it: a manual or admin
// test send must not mark the week as delivered, or it would suppress the user's
// real digest.
export async function sendDigestEmailForUser(
  userId: string,
  userEmail: string,
  options: { markSent?: boolean } = {}
): Promise<{ sent: boolean }> {
  const supabase = createSupabaseAdminClient();
  const resend = getResendClient();
  const now = new Date();

  // Fetch user's organizations
  const { data: orgMembers } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId);

  const orgIds = orgMembers?.map(m => m.organization_id) || [];
  if (orgIds.length === 0) return { sent: false };

  // Fetch invoices
  const { data: invoices, error: invError } = await supabase
    .from("invoices")
    .select("*")
    .in("organization_id", orgIds);

  if (invError || !invoices) return { sent: false };

  const { data: events } = await supabase
    .from("events")
    .select("*, invoices(recipient_name)")
    .in("organization_id", orgIds);

    // Group invoices by currency
    const invoicesByCurrency = (invoices || []).reduce((acc, inv) => {
      const currency = inv.currency || "USD";
      if (!acc[currency]) acc[currency] = [];
      acc[currency].push(inv as unknown as InvoiceRecord);
      return acc;
    }, {} as Record<string, InvoiceRecord[]>);

    // Group events by currency
    const eventsByCurrency = (events || []).reduce((acc, ev) => {
      const currency = ev.currency || "USD";
      if (!acc[currency]) acc[currency] = [];
      acc[currency].push(ev as unknown as CustomerEvent);
      return acc;
    }, {} as Record<string, CustomerEvent[]>);

    const allCurrencies = Array.from(new Set([...Object.keys(invoicesByCurrency), ...Object.keys(eventsByCurrency)]));

    const currencyDigests = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const currency of allCurrencies) {
      const currInvoices = invoicesByCurrency[currency] || [];
      const currEvents = eventsByCurrency[currency] || [];

      let totalOut = 0;
      let totalOver = 0;
      let overdueCount = 0;
      
      let totalCollected = 0;
      let totalDaysToPayment = 0;
      let paidCustomersWithDates = 0;
      let revenueThisMonth = 0;
      let revenueLastMonth = 0;

      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
      const lastMonth = lastMonthDate.getMonth();
      const lastMonthYear = lastMonthDate.getFullYear();

      type OverdueItem = { clientName: string; amount: string; daysOverdue: number; lastContact?: string; rawAmount: number };
      type UpcomingItem = { clientName: string; amount: string; dueInDays: number };
      type PromiseItem = { clientName: string; amount: string; dueDate: string };
      type PaymentItem = { clientName: string; amount: string; date: string; currency: string };
      const overdueInvoicesList: OverdueItem[] = [];
      const upcomingInvoicesList: UpcomingItem[] = [];
      const promisesThisWeekList: PromiseItem[] = [];
      const paymentsReceivedList: PaymentItem[] = [];
      const actionItemsList: string[] = [];

      const agingBuckets: Record<string, number> = { "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
      const forecastBuckets: Record<string, number> = { "0-30 Days": 0, "31-60 Days": 0, "61-90 Days": 0 };
      
      let followupsBeforePaymentCount = 0;
      let customersWithFollowupsAndPaid = 0;
      const customersWithPromises = new Set<string>();
      const customersWithPromisesKept = new Set<string>();

      currInvoices.forEach((inv: InvoiceRecord) => {
        const remaining = Number(inv.amount_owed) - Number(inv.amount_paid);
        const paid = Number(inv.amount_paid);
        
        totalOut += Math.max(0, remaining);
        totalCollected += paid;

        const isPaid = remaining <= 0 || isEffectivelyPaid(inv);
        
        if (isPaid && inv.client_paid_at && inv.due_date) {
          paidCustomersWithDates++;
          const invDate = new Date(inv.due_date);
          const paidDate = new Date(inv.client_paid_at);
          const diffTime = Math.abs(paidDate.getTime() - invDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          totalDaysToPayment += diffDays;
        }

        if (remaining <= 0) return;

        const daysOverdue = getDaysOverdue(inv);
        
        if (daysOverdue !== null) {
          totalOver += remaining;
          overdueCount++;

          if (daysOverdue <= 30) agingBuckets["1-30"] += remaining;
          else if (daysOverdue <= 60) agingBuckets["31-60"] += remaining;
          else if (daysOverdue <= 90) agingBuckets["61-90"] += remaining;
          else agingBuckets["90+"] += remaining;

          const clientName = inv.recipient_name || (inv as unknown as { clients?: { name?: string } }).clients?.name || "Unknown";
          const existingInv = overdueInvoicesList.find(o => o.clientName === clientName);
          
          if (existingInv) {
            existingInv.rawAmount += remaining;
            existingInv.amount = `${currency} ${existingInv.rawAmount.toFixed(2)}`;
            existingInv.daysOverdue = Math.max(existingInv.daysOverdue, daysOverdue);
            if (inv.last_sent_at && (!existingInv.lastContact || new Date(inv.last_sent_at) > new Date(existingInv.lastContact))) {
              existingInv.lastContact = new Date(inv.last_sent_at).toLocaleDateString();
            }
          } else {
            overdueInvoicesList.push({
              clientName: clientName,
              amount: `${currency} ${remaining.toFixed(2)}`,
              daysOverdue: daysOverdue,
              lastContact: inv.last_sent_at ? new Date(inv.last_sent_at).toLocaleDateString() : undefined,
              rawAmount: remaining
            });
          }

          if (daysOverdue > 15 && actionItemsList.length <= 5) {
            actionItemsList.push(`Follow up with ${inv.recipient_name || (inv as unknown as { clients?: { name?: string } }).clients?.name || "Unknown"} on ${currency} ${remaining.toFixed(2)} (${daysOverdue} days overdue)`);
          }
        } else if (inv.due_date) {
          const due = new Date(inv.due_date);
          const diffTime = due.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 30) forecastBuckets["0-30 Days"] += remaining;
          else if (diffDays <= 60) forecastBuckets["31-60 Days"] += remaining;
          else if (diffDays <= 90) forecastBuckets["61-90 Days"] += remaining;

          if (diffDays >= 0 && diffDays <= 14) {
            upcomingInvoicesList.push({
              clientName: inv.recipient_name || "Unknown",
              amount: `${currency} ${remaining.toFixed(2)}`,
              dueInDays: diffDays
            });
          }
        }

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

      const collectionsByMonth: Record<string, number> = {};
      const followupsByMonth: Record<string, number> = {};
      const monthLabels: string[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const mKey = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        collectionsByMonth[mKey] = 0;
        followupsByMonth[mKey] = 0;
        monthLabels.push(mKey);
      }
      
      const followupsPerCustomer: Record<string, number> = {};

      type EventRecord = { created_at: string; event_type: string; amount?: number; customer_id?: string; client_id?: string; invoice_id?: string; event_date?: string; followup_outcome?: string; invoices?: { recipient_name?: string; currency?: string } };
      currEvents.forEach((e: EventRecord) => {
        const date = new Date(e.created_at);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        const eMonth = date.getMonth();
        const eYear = date.getFullYear();
        const clientId = e.client_id ?? e.customer_id ?? "";

        if (e.event_type === "payment" && e.amount) {
          if (collectionsByMonth[monthKey] !== undefined) {
            collectionsByMonth[monthKey] += Number(e.amount);
          }
          if (eMonth === currentMonth && eYear === currentYear) {
            revenueThisMonth += Number(e.amount);
          } else if (eMonth === lastMonth && eYear === lastMonthYear) {
            revenueLastMonth += Number(e.amount);
          }
          if (clientId && followupsPerCustomer[clientId] > 0) {
            customersWithFollowupsAndPaid++;
            followupsBeforePaymentCount += followupsPerCustomer[clientId];
          }
          if (clientId && customersWithPromises.has(clientId)) {
            customersWithPromisesKept.add(clientId);
          }
          
          if (date >= sevenDaysAgo) {
            paymentsReceivedList.push({
              clientName: e.invoices?.recipient_name || "Unknown",
              amount: `${currency} ${Number(e.amount).toFixed(2)}`,
              date: date.toLocaleDateString(),
              currency: e.invoices?.currency || currency
            });
          }

        } else if (e.event_type === "followup") {
          if (followupsByMonth[monthKey] !== undefined) {
            followupsByMonth[monthKey] += 1;
          }
          if (clientId) {
            followupsPerCustomer[clientId] = (followupsPerCustomer[clientId] || 0) + 1;
          }
          if (e.followup_outcome === "promise_made" && clientId) {
            customersWithPromises.add(clientId);
          }
        }
      });

      const promiseKeptRate = customersWithPromises.size > 0 
        ? (customersWithPromisesKept.size / customersWithPromises.size) * 100 
        : 0;

      const avgFollowupsBeforePayment = customersWithFollowupsAndPaid > 0 
        ? (followupsBeforePaymentCount / customersWithFollowupsAndPaid).toFixed(1) 
        : "0";

      const collectionRate = (totalCollected + totalOut) > 0 ? (totalCollected / (totalCollected + totalOut)) * 100 : 0;

      upcomingInvoicesList.sort((a, b) => a.dueInDays - b.dueInDays);
      overdueInvoicesList.sort((a, b) => b.rawAmount - a.rawAmount);
      
      const topOffenders = overdueInvoicesList.sort((a, b) => b.rawAmount - a.rawAmount).slice(0, 5);

      const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency, maximumFractionDigits: 0 });

      // Build charts
      const encodeChart = (config: Record<string, unknown>) => `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&w=500&h=300&bkg=transparent&f=png&v=3`;

      const lightThemeColors = {
        text: '#18181b',
        grid: 'rgba(0,0,0,0.1)',
        tick: '#71717a'
      };

      const chartOptions = {
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            align: 'top',
            anchor: 'end',
            color: lightThemeColors.text,
            font: { weight: 'bold', family: 'sans-serif' }
          }
        },
        scales: {
          x: { ticks: { color: lightThemeColors.tick }, grid: { display: false } },
          y: { ticks: { color: lightThemeColors.tick }, grid: { color: lightThemeColors.grid } }
        }
      };

      const outstandingAmount = Math.max(0, totalOut - totalOver);
      const pipelineStatusChartUrl = encodeChart({
        type: 'doughnut',
        data: {
          labels: ['Paid', 'Outstanding', 'Overdue'],
          datasets: [{
            backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
            data: [totalCollected, outstandingAmount, totalOver],
            borderWidth: 0,
            cutout: '70%'
          }]
        },
        options: {
          plugins: {
            legend: { display: true, position: 'bottom', labels: { font: { family: 'sans-serif' } } },
            datalabels: { display: false }
          }
        }
      });

      const agingChartUrl = encodeChart({
        type: 'bar',
        data: {
          labels: ['1-30', '31-60', '61-90', '90+'],
          datasets: [{
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
            data: [agingBuckets["1-30"], agingBuckets["31-60"], agingBuckets["61-90"], agingBuckets["90+"]],
            borderRadius: 4,
            barThickness: 30
          }]
        },
        options: chartOptions
      });

      const forecastChartUrl = encodeChart({
        type: 'bar',
        data: {
          labels: ['0-30', '31-60', '61-90'],
          datasets: [{
            backgroundColor: '#3b82f6',
            data: [forecastBuckets["0-30 Days"], forecastBuckets["31-60 Days"], forecastBuckets["61-90 Days"]],
            borderRadius: 4,
            barThickness: 30
          }]
        },
        options: chartOptions
      });

      const topOffendersChartUrl = encodeChart({
        type: 'bar',
        data: {
          labels: topOffenders.map(o => o.clientName.substring(0, 15)),
          datasets: [{
            backgroundColor: '#ef4444',
            data: topOffenders.map(o => o.rawAmount),
            borderRadius: 4,
            barThickness: 20
          }]
        },
        options: {
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            datalabels: {
              display: true,
              align: 'right',
              anchor: 'end',
              color: lightThemeColors.text,
              font: { weight: 'bold', family: 'sans-serif' }
            }
          },
          scales: {
            x: { ticks: { color: lightThemeColors.tick }, grid: { color: lightThemeColors.grid } },
            y: { ticks: { color: lightThemeColors.tick }, grid: { display: false } }
          }
        }
      });

      const collectionsDataArray = monthLabels.map(m => collectionsByMonth[m]);
      const collectionTrendsChartUrl = encodeChart({
        type: 'line',
        data: {
          labels: monthLabels,
          datasets: [{
            label: 'Revenue',
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            data: collectionsDataArray,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0
          }]
        },
        options: {
          ...chartOptions,
          plugins: {
            ...chartOptions.plugins,
            datalabels: { display: false }
          }
        }
      });

      const followupsDataArray = monthLabels.map(m => followupsByMonth[m]);
      const followupActivityChartUrl = encodeChart({
        type: 'bar',
        data: {
          labels: monthLabels,
          datasets: [{
            label: 'Follow-ups',
            backgroundColor: '#3b82f6',
            data: followupsDataArray,
            borderRadius: 4,
            barThickness: 30
          }]
        },
        options: chartOptions
      });

      currencyDigests.push({
        currencyCode: currency,
        rawTotalOut: totalOut,
        totalOutstanding: formatter.format(totalOut),
        totalOverdue: formatter.format(totalOver),
        totalCollected: formatter.format(totalCollected),
        revenueThisMonth: formatter.format(revenueThisMonth),
        revenueLastMonth: formatter.format(revenueLastMonth),
        averageDaysToPayment: paidCustomersWithDates > 0 ? Math.round(totalDaysToPayment / paidCustomersWithDates) : 0,
        collectionRate,
        promiseKeptRate,
        avgFollowupsBeforePayment,
        overdueCount,
        
        collectionTrendsChartUrl,
        pipelineStatusChartUrl,
        topOffendersChartUrl,
        agingChartUrl,
        forecastChartUrl,
        followupActivityChartUrl,

        upcomingInvoices: upcomingInvoicesList,
        overdueInvoices: topOffenders,
        promisesThisWeek: promisesThisWeekList,
        paymentsReceived: paymentsReceivedList,
        actionItems: actionItemsList
      });
    }

    currencyDigests.sort((a, b) => b.rawTotalOut - a.rawTotalOut);

    const dateRange = `${sevenDaysAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`;

    try {
      const htmlContent = await render(
        WeeklyDigestEmail({
          dateRange,
          currencies: currencyDigests
        })
      );

      const subject = "Your weekly collections snapshot";

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
          from: getFromEmail(),
          to: userEmail,
          subject,
          html: htmlContent,
        });
      }

      if (options.markSent) {
        const { error: markError } = await supabase
          .from("profiles")
          .update({ last_digest_sent_at: new Date().toISOString() })
          .eq("user_id", userId);

        // The email is already out. Failing to record that is worth an alert,
        // but not a thrown error: throwing would make Inngest retry the step and
        // send the digest a second time.
        if (markError) {
          logger.error({ message: "Digest sent but failed to record last_digest_sent_at", error: markError, user_id: userId, context: "sendDigestEmailForUser" });
        }
      }

      return { sent: true };
    } catch (e) {
      logger.error({ message: "Failed to send digest email", error: e, user_id: userId, context: "sendDigestEmailForUser" });
      return { sent: false };
    }
}

// Convenience wrapper for non-Inngest callers (e.g. manual/admin triggers).
// The Inngest function itself calls the two pieces above directly so each
// user's send can be memoized as its own step - see lib/inngest/functions/send-digest.ts.
export async function sendWeeklyDigestEmails(targetUserId?: string) {
  const result = await getEligibleDigestRecipients(targetUserId);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Only the untargeted (scheduled, everyone-who-is-due) form records delivery.
  // A targeted send is a manual/test send for one user and must not consume that
  // user's digest for the week.
  const markSent = !targetUserId;

  let emailsSent = 0;
  for (const { userId, userEmail } of result.recipients) {
    const { sent } = await sendDigestEmailForUser(userId, userEmail, { markSent });
    if (sent) emailsSent++;
  }

  return { success: true, count: emailsSent };
}
