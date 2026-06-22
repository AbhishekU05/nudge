import "server-only";

import { getResendClient, getFromEmail } from "@/lib/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDaysOverdue } from "@/lib/types";
import { logger } from "@/lib/logger";
import { hasGmailTokens, sendGmail } from "@/lib/gmail";
import { render } from "@react-email/render";
import WeeklyDigestEmail from "@/components/emails/WeeklyDigest";

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

    const { data: events } = await supabase
      .from("customer_events")
      .select("*, invoices(recipient_name)")
      .eq("user_id", userId);

    // Group invoices by currency
    const invoicesByCurrency = invoices.reduce((acc, inv) => {
      const currency = inv.currency || "USD";
      if (!acc[currency]) acc[currency] = [];
      acc[currency].push(inv);
      return acc;
    }, {} as Record<string, any[]>);

    // Group events by currency
    const eventsByCurrency = (events || []).reduce((acc, ev) => {
      const currency = ev.currency || "USD";
      if (!acc[currency]) acc[currency] = [];
      acc[currency].push(ev);
      return acc;
    }, {} as Record<string, any[]>);

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

      const overdueInvoicesList: any[] = [];
      const upcomingInvoicesList: any[] = [];
      const promisesThisWeekList: any[] = [];
      const paymentsReceivedList: any[] = [];
      const actionItemsList: string[] = [];

      const agingBuckets: Record<string, number> = { "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
      const forecastBuckets: Record<string, number> = { "0-30 Days": 0, "31-60 Days": 0, "61-90 Days": 0 };
      
      let followupsBeforePaymentCount = 0;
      let customersWithFollowupsAndPaid = 0;
      const customersWithPromises = new Set<string>();
      const customersWithPromisesKept = new Set<string>();

      currInvoices.forEach((inv: any) => {
        const remaining = Number(inv.amount_owed) - Number(inv.amount_paid);
        const paid = Number(inv.amount_paid);
        
        totalOut += Math.max(0, remaining);
        totalCollected += paid;

        const isPaid = remaining <= 0 || inv.client_paid_at;
        
        if (isPaid && inv.client_paid_at && inv.due_date) {
          paidCustomersWithDates++;
          const invDate = new Date(inv.due_date);
          const paidDate = new Date(inv.client_paid_at);
          const diffTime = Math.abs(paidDate.getTime() - invDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          totalDaysToPayment += diffDays;
        }

        if (remaining <= 0) return;

        const daysOverdue = getDaysOverdue(inv as any);
        
        if (daysOverdue !== null) {
          totalOver += remaining;
          overdueCount++;

          if (daysOverdue <= 30) agingBuckets["1-30"] += remaining;
          else if (daysOverdue <= 60) agingBuckets["31-60"] += remaining;
          else if (daysOverdue <= 90) agingBuckets["61-90"] += remaining;
          else agingBuckets["90+"] += remaining;

          overdueInvoicesList.push({
            clientName: inv.recipient_name || "Unknown",
            amount: `${currency} ${remaining.toFixed(2)}`,
            daysOverdue: daysOverdue,
            lastContact: inv.last_sent_at ? new Date(inv.last_sent_at).toLocaleDateString() : undefined,
            rawAmount: remaining
          });

          if (daysOverdue > 15 && overdueInvoicesList.length <= 5) {
            actionItemsList.push(`Follow up with ${inv.recipient_name || "Unknown"} on ${currency} ${remaining.toFixed(2)} (${daysOverdue} days overdue)`);
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

      currEvents.forEach((e: any) => {
        const date = new Date(e.created_at);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        const eMonth = date.getMonth();
        const eYear = date.getFullYear();

        if (e.event_type === "payment" && e.amount) {
          if (collectionsByMonth[monthKey] !== undefined) {
            collectionsByMonth[monthKey] += Number(e.amount);
          }
          if (eMonth === currentMonth && eYear === currentYear) {
            revenueThisMonth += Number(e.amount);
          } else if (eMonth === lastMonth && eYear === lastMonthYear) {
            revenueLastMonth += Number(e.amount);
          }
          if (followupsPerCustomer[e.customer_id] > 0) {
            customersWithFollowupsAndPaid++;
            followupsBeforePaymentCount += followupsPerCustomer[e.customer_id];
          }
          if (customersWithPromises.has(e.customer_id)) {
            customersWithPromisesKept.add(e.customer_id);
          }
          
          if (date >= sevenDaysAgo) {
            paymentsReceivedList.push({
              clientName: e.invoices?.recipient_name || "Unknown",
              amount: `${currency} ${Number(e.amount).toFixed(2)}`,
              date: date.toLocaleDateString()
            });
          }

        } else if (e.event_type === "followup") {
          if (followupsByMonth[monthKey] !== undefined) {
            followupsByMonth[monthKey] += 1;
          }
          followupsPerCustomer[e.customer_id] = (followupsPerCustomer[e.customer_id] || 0) + 1;
          if (e.followup_outcome === "promise_made") {
            customersWithPromises.add(e.customer_id);
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
      
      const topOffenders = overdueInvoicesList.slice(0, 5);

      const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency, maximumFractionDigits: 0 });

      // Build charts
      const encodeChart = (config: any) => `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&w=500&h=300&bkg=transparent&f=png`;

      const lightThemeColors = {
        text: '#18181b',
        grid: 'rgba(0,0,0,0.1)',
        tick: '#71717a'
      };

      const chartOptions = {
        legend: { display: false },
        scales: {
          xAxes: [{ ticks: { fontColor: lightThemeColors.tick }, gridLines: { display: false } }],
          yAxes: [{ ticks: { fontColor: lightThemeColors.tick }, gridLines: { color: lightThemeColors.grid } }]
        },
        plugins: {
          datalabels: {
            display: true,
            align: 'top',
            color: lightThemeColors.text,
            font: { weight: 'bold' }
          }
        }
      };

      const outstandingAmount = Math.max(0, totalOut - totalOver);
      const pipelineStatusChartUrl = encodeChart({
        type: 'outlabeledPie',
        data: {
          labels: ['Paid', 'Outstanding', 'Overdue'],
          datasets: [{
            backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
            data: [totalCollected, outstandingAmount, totalOver]
          }]
        },
        options: {
          plugins: {
            legend: false,
            outlabels: {
              text: '%l: %v',
              color: '#18181b',
              stretch: 35,
              font: { resizable: true, minSize: 12, maxSize: 18 }
            }
          }
        }
      });

      const agingChartUrl = encodeChart({
        type: 'bar',
        data: {
          labels: ['1-30', '31-60', '61-90', '90+'],
          datasets: [{
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
            data: [agingBuckets["1-30"], agingBuckets["31-60"], agingBuckets["61-90"], agingBuckets["90+"]]
          }]
        },
        options: chartOptions
      });

      const topOffendersChartUrl = encodeChart({
        type: 'horizontalBar',
        data: {
          labels: topOffenders.map(o => o.clientName.substring(0, 15)),
          datasets: [{
            backgroundColor: '#ef4444',
            data: topOffenders.map(o => o.rawAmount)
          }]
        },
        options: {
          legend: { display: false },
          scales: {
            xAxes: [{ ticks: { fontColor: lightThemeColors.tick }, gridLines: { color: lightThemeColors.grid } }],
            yAxes: [{ ticks: { fontColor: lightThemeColors.tick }, gridLines: { display: false } }]
          },
          plugins: {
            datalabels: {
              display: true,
              align: 'right',
              color: lightThemeColors.text,
              font: { weight: 'bold' }
            }
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
            fill: true
          }]
        },
        options: chartOptions
      });

      const followupsDataArray = monthLabels.map(m => followupsByMonth[m]);
      const followupActivityChartUrl = encodeChart({
        type: 'bar',
        data: {
          labels: monthLabels,
          datasets: [{
            label: 'Follow-ups',
            backgroundColor: '#3b82f6',
            data: followupsDataArray
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
        emailsSent++;
      } else {
        await resend.emails.send({
          from: getFromEmail(),
          to: userEmail,
          subject,
          html: htmlContent,
        });
        emailsSent++;
      }
    } catch (e) {
      logger.error({ message: "Failed to send digest email", error: e, user_id: userId, context: "sendWeeklyDigestEmails" });
    }
  }

  return { success: true, count: emailsSent };
}
