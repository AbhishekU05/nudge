import "server-only";

import { getResendClient, getFromEmail } from "@/lib/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { hasGmailTokens, sendGmail } from "@/lib/gmail";
import { render } from "@react-email/render";
import WeeklyDigestEmail, { type CurrencyDigest } from "@/components/emails/WeeklyDigest";

export type DigestRecipient = { userId: string; userEmail: string; organizationId: string };

// A digest is due once a week. Six days (rather than seven) gives the check
// slack: a send at 08:05 last Monday must not make this Monday's 08:00 tick look
// like "only 6d23h has passed, skip" and push the digest to 09:00 every week.
const DIGEST_MIN_INTERVAL_MS = 6 * 24 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;
const PAID_STATUSES = new Set(["paid", "written_off"]);

function digestAlreadySentThisWeek(lastSentAt: string | null, now: Date) {
  if (!lastSentAt) return false;
  const lastSent = new Date(lastSentAt);
  if (Number.isNaN(lastSent.getTime())) return false;
  return now.getTime() - lastSent.getTime() < DIGEST_MIN_INTERVAL_MS;
}

// ---------------------------------------------------------------------------
// Recipients
// ---------------------------------------------------------------------------

// The digest is opt-OUT: every organization member gets it unless they have
// explicitly set weekly_digest_enabled = false. `profiles` rows are created
// lazily (a user only gets one once they change a setting), so a missing row
// means "never expressed a preference", not "not subscribed" - starting from
// organization_members rather than profiles is what makes that work.
export async function getEligibleDigestRecipients(
  targetUserId?: string
): Promise<{ success: true; recipients: DigestRecipient[] } | { success: false; error: unknown }> {
  const supabase = createSupabaseAdminClient();

  let membersQuery = supabase.from("organization_members").select("user_id, organization_id");
  if (targetUserId) membersQuery = membersQuery.eq("user_id", targetUserId);

  const { data: members, error: membersError } = await membersQuery;

  if (membersError || !members) {
    logger.error({ message: "Failed to fetch organization members for digest", error: membersError, context: "getEligibleDigestRecipients" });
    return { success: false, error: membersError };
  }
  if (members.length === 0) return { success: true, recipients: [] };

  const userIds = Array.from(new Set(members.map(m => m.user_id)));

  // profiles and organization_members have no foreign key between them (both
  // reference auth.users independently), so this join cannot be a PostgREST
  // embed - it has to be done here.
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, weekly_digest_enabled, last_digest_sent_at")
    .in("user_id", userIds);

  if (profilesError) {
    logger.error({ message: "Failed to fetch profiles for digest", error: profilesError, context: "getEligibleDigestRecipients" });
    return { success: false, error: profilesError };
  }

  const profileByUserId = new Map(
    (profiles || []).map(p => [p.user_id as string, p as { weekly_digest_enabled: boolean | null; last_digest_sent_at: string | null }])
  );

  const orgIds = Array.from(new Set(members.map(m => m.organization_id)));
  const { data: organizations, error: orgsError } = await supabase
    .from("organizations")
    .select("id, timezone")
    .in("id", orgIds);

  if (orgsError) {
    logger.error({ message: "Failed to fetch organizations for digest", error: orgsError, context: "getEligibleDigestRecipients" });
    return { success: false, error: orgsError };
  }

  const timezoneByOrgId = new Map((organizations || []).map(o => [o.id as string, (o.timezone as string | null) || "UTC"]));

  const now = new Date();
  const eligible = members.filter(member => {
    const profile = profileByUserId.get(member.user_id);

    if (profile?.weekly_digest_enabled === false) return false;
    if (targetUserId) return true; // manual/test send bypasses the schedule

    if (digestAlreadySentThisWeek(profile?.last_digest_sent_at ?? null, now)) return false;

    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezoneByOrgId.get(member.organization_id) || "UTC",
        weekday: "short",
        hour: "numeric",
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      const weekday = parts.find(p => p.type === "weekday")?.value;
      const hour = Number(parts.find(p => p.type === "hour")?.value);
      // "Monday, 08:00 or later" rather than "exactly hour 8": paired with the
      // last_digest_sent_at guard above, a delayed or failed tick is picked up by
      // the next hourly run instead of silently losing the week.
      return weekday === "Mon" && hour >= 8;
    } catch {
      return false;
    }
  });

  if (eligible.length === 0) return { success: true, recipients: [] };

  // listUsers() paginates at 50 by default, which would silently drop recipients
  // as the user count grows. Look each one up directly instead.
  const recipients: DigestRecipient[] = [];
  for (const member of eligible) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(member.user_id);
    if (userError || !userData?.user?.email) {
      logger.error({ message: "Failed to fetch user for digest", error: userError, user_id: member.user_id, context: "getEligibleDigestRecipients" });
      continue;
    }
    recipients.push({ userId: member.user_id, userEmail: userData.user.email, organizationId: member.organization_id });
  }

  return { success: true, recipients };
}

// ---------------------------------------------------------------------------
// Digest content, built once per organization
// ---------------------------------------------------------------------------

type InvoiceRow = {
  id: string;
  client_id: string | null;
  amount: number | string | null;
  currency: string | null;
  due_date: string | null;
  status: string | null;
  created_at: string;
  last_sent_at: string | null;
  clients?: { name?: string | null } | null;
};

type PaymentRow = {
  invoice_id: string | null;
  amount: number | string | null;
  currency: string | null;
  payment_date: string | null;
  created_at: string;
};

type EventRow = { event_type: string; client_id: string | null; created_at: string };

const encodeChart = (config: Record<string, unknown>) =>
  `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&w=500&h=300&bkg=transparent&f=png&v=3`;

const chartText = "#18181b";
const chartGrid = "rgba(0,0,0,0.1)";
const chartTick = "#71717a";

const chartOptions = {
  plugins: {
    legend: { display: false },
    datalabels: { display: true, align: "top", anchor: "end", color: chartText, font: { weight: "bold", family: "sans-serif" } },
  },
  scales: {
    x: { ticks: { color: chartTick }, grid: { display: false } },
    y: { ticks: { color: chartTick }, grid: { color: chartGrid } },
  },
};

// The digest is entirely organization-scoped: every member of an org receives
// the identical email. Building it per-recipient meant an org with N members ran
// the whole query-and-aggregate pass N times to produce N identical results, and
// every org in a given timezone did that in the same hourly tick. This is called
// once per org and the result is shared across its members.
export async function buildOrgDigest(
  organizationId: string,
  now: Date = new Date()
): Promise<CurrencyDigest[]> {
  const supabase = createSupabaseAdminClient();

  // Columns here are the ones that actually exist. The digest previously read
  // invoices.amount_owed / .amount_paid / .recipient_name / .workflow_status and
  // events.amount / .currency / event_type = 'payment', none of which are real:
  // money came out as NaN and every payment-derived figure was zero. Amounts paid
  // come from the payments table; client names come from clients.
  const [invoicesRes, paymentsRes, eventsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, client_id, amount, currency, due_date, status, created_at, last_sent_at, clients(name)")
      .eq("organization_id", organizationId),
    supabase
      .from("payments")
      .select("invoice_id, amount, currency, payment_date, created_at")
      .eq("organization_id", organizationId),
    supabase
      .from("events")
      .select("event_type, client_id, created_at")
      .eq("organization_id", organizationId)
      .eq("event_type", "followup"),
  ]);

  if (invoicesRes.error) {
    logger.error({ message: "Failed to fetch invoices for digest", error: invoicesRes.error, organization_id: organizationId, context: "buildOrgDigest" });
    return [];
  }
  if (paymentsRes.error) {
    logger.error({ message: "Failed to fetch payments for digest", error: paymentsRes.error, organization_id: organizationId, context: "buildOrgDigest" });
    return [];
  }
  if (eventsRes.error) {
    logger.error({ message: "Failed to fetch events for digest", error: eventsRes.error, organization_id: organizationId, context: "buildOrgDigest" });
    return [];
  }

  const invoices = (invoicesRes.data || []) as unknown as InvoiceRow[];
  const payments = (paymentsRes.data || []) as unknown as PaymentRow[];
  const followupEvents = (eventsRes.data || []) as unknown as EventRow[];

  if (invoices.length === 0 && payments.length === 0) return [];

  // Roll payments up per invoice: this is what amount_paid actually is.
  const paidByInvoice = new Map<string, number>();
  const lastPaymentAtByInvoice = new Map<string, number>();
  for (const payment of payments) {
    if (!payment.invoice_id) continue;
    const amount = Number(payment.amount) || 0;
    paidByInvoice.set(payment.invoice_id, (paidByInvoice.get(payment.invoice_id) || 0) + amount);

    const paidAt = new Date(payment.payment_date || payment.created_at).getTime();
    if (!Number.isNaN(paidAt)) {
      const previous = lastPaymentAtByInvoice.get(payment.invoice_id);
      if (previous === undefined || paidAt > previous) lastPaymentAtByInvoice.set(payment.invoice_id, paidAt);
    }
  }

  const invoiceById = new Map(invoices.map(inv => [inv.id, inv]));

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const lastMonth = lastMonthDate.getMonth();
  const lastMonthYear = lastMonthDate.getFullYear();

  const monthLabels: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    monthLabels.push(d.toLocaleString("default", { month: "short", year: "numeric" }));
  }

  // Follow-ups are org-wide (events carry no currency), so count them once.
  const followupsByClient = new Map<string, number>();
  const followupsByMonth: Record<string, number> = {};
  for (const label of monthLabels) followupsByMonth[label] = 0;

  for (const event of followupEvents) {
    const date = new Date(event.created_at);
    const monthKey = date.toLocaleString("default", { month: "short", year: "numeric" });
    if (followupsByMonth[monthKey] !== undefined) followupsByMonth[monthKey] += 1;
    if (event.client_id) followupsByClient.set(event.client_id, (followupsByClient.get(event.client_id) || 0) + 1);
  }

  const currencyOf = (value: string | null | undefined) => value || "USD";

  const invoicesByCurrency = new Map<string, InvoiceRow[]>();
  for (const invoice of invoices) {
    const currency = currencyOf(invoice.currency);
    const bucket = invoicesByCurrency.get(currency) || [];
    bucket.push(invoice);
    invoicesByCurrency.set(currency, bucket);
  }

  const paymentsByCurrency = new Map<string, PaymentRow[]>();
  for (const payment of payments) {
    // Fall back to the invoice's currency when the payment row doesn't carry one.
    const invoice = payment.invoice_id ? invoiceById.get(payment.invoice_id) : undefined;
    const currency = currencyOf(payment.currency || invoice?.currency);
    const bucket = paymentsByCurrency.get(currency) || [];
    bucket.push(payment);
    paymentsByCurrency.set(currency, bucket);
  }

  const allCurrencies = Array.from(new Set([...invoicesByCurrency.keys(), ...paymentsByCurrency.keys()]));
  const currencyDigests: (CurrencyDigest & { rawTotalOut: number })[] = [];

  for (const currency of allCurrencies) {
    const currInvoices = invoicesByCurrency.get(currency) || [];
    const currPayments = paymentsByCurrency.get(currency) || [];

    let totalOut = 0;
    let totalOver = 0;
    let overdueCount = 0;
    let totalCollected = 0;
    let totalDaysToPayment = 0;
    let paidInvoicesWithDates = 0;

    let promisedCount = 0;
    let promisedSettledCount = 0;

    type OverdueItem = { clientName: string; amount: string; daysOverdue: number; lastContact?: string; rawAmount: number };
    const overdueInvoicesList: OverdueItem[] = [];
    const upcomingInvoicesList: { clientName: string; amount: string; dueInDays: number }[] = [];
    const promisesThisWeekList: { clientName: string; amount: string; dueDate: string }[] = [];
    const actionItemsList: string[] = [];

    const agingBuckets: Record<string, number> = { "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    const forecastBuckets: Record<string, number> = { "0-30 Days": 0, "31-60 Days": 0, "61-90 Days": 0 };

    for (const invoice of currInvoices) {
      const owed = Number(invoice.amount) || 0;
      const paid = paidByInvoice.get(invoice.id) || 0;
      const remaining = Math.max(0, owed - paid);
      const isPaid = PAID_STATUSES.has(invoice.status || "") || (owed > 0 && paid >= owed);
      const clientName = invoice.clients?.name || "Unknown";

      totalCollected += paid;
      totalOut += remaining;

      if (isPaid) {
        const paidAt = lastPaymentAtByInvoice.get(invoice.id);
        if (paidAt && invoice.due_date) {
          const dueAt = new Date(invoice.due_date).getTime();
          if (!Number.isNaN(dueAt)) {
            paidInvoicesWithDates++;
            totalDaysToPayment += Math.ceil(Math.abs(paidAt - dueAt) / DAY_MS);
          }
        }
      }

      if (invoice.status === "promised") {
        promisedCount++;
        if (remaining <= 0) promisedSettledCount++;
      }

      if (isPaid || remaining <= 0) continue;

      const dueAt = invoice.due_date ? new Date(invoice.due_date) : null;
      const isOverdue = dueAt !== null && !Number.isNaN(dueAt.getTime()) && dueAt.getTime() < startOfToday.getTime();

      if (isOverdue && dueAt) {
        const daysOverdue = Math.floor((startOfToday.getTime() - dueAt.getTime()) / DAY_MS);
        totalOver += remaining;
        overdueCount++;

        if (daysOverdue <= 30) agingBuckets["1-30"] += remaining;
        else if (daysOverdue <= 60) agingBuckets["31-60"] += remaining;
        else if (daysOverdue <= 90) agingBuckets["61-90"] += remaining;
        else agingBuckets["90+"] += remaining;

        const existing = overdueInvoicesList.find(o => o.clientName === clientName);
        if (existing) {
          existing.rawAmount += remaining;
          existing.amount = `${currency} ${existing.rawAmount.toFixed(2)}`;
          existing.daysOverdue = Math.max(existing.daysOverdue, daysOverdue);
          if (invoice.last_sent_at && (!existing.lastContact || new Date(invoice.last_sent_at) > new Date(existing.lastContact))) {
            existing.lastContact = new Date(invoice.last_sent_at).toLocaleDateString();
          }
        } else {
          overdueInvoicesList.push({
            clientName,
            amount: `${currency} ${remaining.toFixed(2)}`,
            daysOverdue,
            lastContact: invoice.last_sent_at ? new Date(invoice.last_sent_at).toLocaleDateString() : undefined,
            rawAmount: remaining,
          });
        }

        if (daysOverdue > 15 && actionItemsList.length <= 5) {
          actionItemsList.push(`Follow up with ${clientName} on ${currency} ${remaining.toFixed(2)} (${daysOverdue} days overdue)`);
        }
      } else if (dueAt && !Number.isNaN(dueAt.getTime())) {
        const dueInDays = Math.ceil((dueAt.getTime() - now.getTime()) / DAY_MS);

        if (dueInDays <= 30) forecastBuckets["0-30 Days"] += remaining;
        else if (dueInDays <= 60) forecastBuckets["31-60 Days"] += remaining;
        else if (dueInDays <= 90) forecastBuckets["61-90 Days"] += remaining;

        if (dueInDays >= 0 && dueInDays <= 14) {
          upcomingInvoicesList.push({ clientName, amount: `${currency} ${remaining.toFixed(2)}`, dueInDays });
        }

        if (invoice.status === "promised" && dueInDays >= 0 && dueInDays <= 7) {
          promisesThisWeekList.push({
            clientName,
            amount: `${currency} ${remaining.toFixed(2)}`,
            dueDate: dueAt.toLocaleDateString(),
          });
        }
      }
    }

    // Payment-derived figures now come from the payments table rather than from
    // an events row type ('payment') that does not exist in the schema.
    let revenueThisMonth = 0;
    let revenueLastMonth = 0;
    const collectionsByMonth: Record<string, number> = {};
    for (const label of monthLabels) collectionsByMonth[label] = 0;

    const paymentsReceivedList: { clientName: string; amount: string; date: string }[] = [];
    const clientsWithPayments = new Set<string>();

    for (const payment of currPayments) {
      const paidAt = new Date(payment.payment_date || payment.created_at);
      if (Number.isNaN(paidAt.getTime())) continue;

      const amount = Number(payment.amount) || 0;
      const monthKey = paidAt.toLocaleString("default", { month: "short", year: "numeric" });
      if (collectionsByMonth[monthKey] !== undefined) collectionsByMonth[monthKey] += amount;

      if (paidAt.getMonth() === currentMonth && paidAt.getFullYear() === currentYear) revenueThisMonth += amount;
      else if (paidAt.getMonth() === lastMonth && paidAt.getFullYear() === lastMonthYear) revenueLastMonth += amount;

      const invoice = payment.invoice_id ? invoiceById.get(payment.invoice_id) : undefined;
      if (invoice?.client_id) clientsWithPayments.add(invoice.client_id);

      if (paidAt >= sevenDaysAgo) {
        paymentsReceivedList.push({
          clientName: invoice?.clients?.name || "Unknown",
          amount: `${currency} ${amount.toFixed(2)}`,
          date: paidAt.toLocaleDateString(),
        });
      }
    }

    // Follow-ups logged against clients who went on to pay.
    let followupsBeforePayment = 0;
    let payingClientsWithFollowups = 0;
    for (const clientId of clientsWithPayments) {
      const followups = followupsByClient.get(clientId) || 0;
      if (followups > 0) {
        payingClientsWithFollowups++;
        followupsBeforePayment += followups;
      }
    }

    const avgFollowupsBeforePayment = payingClientsWithFollowups > 0
      ? (followupsBeforePayment / payingClientsWithFollowups).toFixed(1)
      : "0";

    // Status is current state, not history: once an invoice is paid its status
    // becomes 'paid' and the fact it was ever 'promised' is gone. This therefore
    // measures promises settled among invoices *still* marked promised, and will
    // under-report. Making it exact needs a status-change history to read from.
    const promiseKeptRate = promisedCount > 0 ? (promisedSettledCount / promisedCount) * 100 : 0;
    const collectionRate = totalCollected + totalOut > 0 ? (totalCollected / (totalCollected + totalOut)) * 100 : 0;

    upcomingInvoicesList.sort((a, b) => a.dueInDays - b.dueInDays);
    overdueInvoicesList.sort((a, b) => b.rawAmount - a.rawAmount);
    const topOffenders = overdueInvoicesList.slice(0, 5);

    const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 });
    const outstandingAmount = Math.max(0, totalOut - totalOver);

    currencyDigests.push({
      currencyCode: currency,
      rawTotalOut: totalOut,
      totalOutstanding: formatter.format(totalOut),
      totalOverdue: formatter.format(totalOver),
      totalCollected: formatter.format(totalCollected),
      revenueThisMonth: formatter.format(revenueThisMonth),
      revenueLastMonth: formatter.format(revenueLastMonth),
      averageDaysToPayment: paidInvoicesWithDates > 0 ? Math.round(totalDaysToPayment / paidInvoicesWithDates) : 0,
      collectionRate,
      promiseKeptRate,
      avgFollowupsBeforePayment,
      overdueCount,

      pipelineStatusChartUrl: encodeChart({
        type: "doughnut",
        data: {
          labels: ["Paid", "Outstanding", "Overdue"],
          datasets: [{ backgroundColor: ["#10b981", "#3b82f6", "#ef4444"], data: [totalCollected, outstandingAmount, totalOver], borderWidth: 0, cutout: "70%" }],
        },
        options: {
          plugins: {
            legend: { display: true, position: "bottom", labels: { font: { family: "sans-serif" } } },
            datalabels: { display: false },
          },
        },
      }),
      agingChartUrl: encodeChart({
        type: "bar",
        data: {
          labels: ["1-30", "31-60", "61-90", "90+"],
          datasets: [{ backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"], data: [agingBuckets["1-30"], agingBuckets["31-60"], agingBuckets["61-90"], agingBuckets["90+"]], borderRadius: 4, barThickness: 30 }],
        },
        options: chartOptions,
      }),
      forecastChartUrl: encodeChart({
        type: "bar",
        data: {
          labels: ["0-30", "31-60", "61-90"],
          datasets: [{ backgroundColor: "#3b82f6", data: [forecastBuckets["0-30 Days"], forecastBuckets["31-60 Days"], forecastBuckets["61-90 Days"]], borderRadius: 4, barThickness: 30 }],
        },
        options: chartOptions,
      }),
      topOffendersChartUrl: encodeChart({
        type: "bar",
        data: {
          labels: topOffenders.map(o => o.clientName.substring(0, 15)),
          datasets: [{ backgroundColor: "#ef4444", data: topOffenders.map(o => o.rawAmount), borderRadius: 4, barThickness: 20 }],
        },
        options: {
          indexAxis: "y",
          plugins: {
            legend: { display: false },
            datalabels: { display: true, align: "right", anchor: "end", color: chartText, font: { weight: "bold", family: "sans-serif" } },
          },
          scales: {
            x: { ticks: { color: chartTick }, grid: { color: chartGrid } },
            y: { ticks: { color: chartTick }, grid: { display: false } },
          },
        },
      }),
      collectionTrendsChartUrl: encodeChart({
        type: "line",
        data: {
          labels: monthLabels,
          datasets: [{ label: "Revenue", borderColor: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.2)", data: monthLabels.map(m => collectionsByMonth[m]), fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0 }],
        },
        options: { ...chartOptions, plugins: { ...chartOptions.plugins, datalabels: { display: false } } },
      }),
      followupActivityChartUrl: encodeChart({
        type: "bar",
        data: {
          labels: monthLabels,
          datasets: [{ label: "Follow-ups", backgroundColor: "#3b82f6", data: monthLabels.map(m => followupsByMonth[m]), borderRadius: 4, barThickness: 30 }],
        },
        options: chartOptions,
      }),

      upcomingInvoices: upcomingInvoicesList,
      overdueInvoices: topOffenders,
      promisesThisWeek: promisesThisWeekList,
      paymentsReceived: paymentsReceivedList,
      actionItems: actionItemsList,
    });
  }

  currencyDigests.sort((a, b) => b.rawTotalOut - a.rawTotalOut);
  return currencyDigests;
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

// `markSent` records delivery so the remaining hourly ticks that Monday skip this
// user. Only the scheduled run sets it: a manual or admin test send must not mark
// the week as delivered, or it would suppress the user's real digest.
export async function sendDigestEmailForUser(
  userId: string,
  userEmail: string,
  digest: CurrencyDigest[],
  options: { markSent?: boolean } = {}
): Promise<{ sent: boolean }> {
  const supabase = createSupabaseAdminClient();
  const now = new Date();

  if (digest.length === 0) return { sent: false };

  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const dateRange = `${sevenDaysAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`;

  try {
    const htmlContent = await render(WeeklyDigestEmail({ dateRange, currencies: digest }));
    const subject = "Your weekly collections snapshot";

    if (await hasGmailTokens(userId)) {
      await sendGmail({ userId, senderName: "Duely Snapshot", senderEmail: userEmail, to: userEmail, subject, body: htmlContent, html: true });
    } else {
      await getResendClient().emails.send({ from: getFromEmail(), to: userEmail, subject, html: htmlContent });
    }

    if (options.markSent) {
      // upsert, not update: profiles rows are created lazily and most users do
      // not have one yet. weekly_digest_enabled is written explicitly because a
      // bare insert would fall back to the column default, which could opt the
      // user out of every future digest. Only users who are not opted out reach
      // this point, so forcing true here cannot override a real preference.
      const { error: markError } = await supabase
        .from("profiles")
        .upsert(
          { user_id: userId, weekly_digest_enabled: true, last_digest_sent_at: now.toISOString() },
          { onConflict: "user_id" }
        );

      // The email is already out. Failing to record that is worth an alert, but
      // not a thrown error: throwing would make Inngest retry the step and send
      // the digest a second time.
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

// Convenience wrapper for non-Inngest callers (e.g. manual/admin triggers). The
// Inngest function calls the pieces above directly so each org build and each
// user's send can be memoized as its own step.
export async function sendWeeklyDigestEmails(targetUserId?: string) {
  const result = await getEligibleDigestRecipients(targetUserId);
  if (!result.success) return { success: false, error: result.error };

  // Only the untargeted (scheduled) form records delivery: a targeted send is a
  // test for one user and must not consume that user's digest for the week.
  const markSent = !targetUserId;

  const digestByOrg = new Map<string, CurrencyDigest[]>();
  let emailsSent = 0;

  for (const { userId, userEmail, organizationId } of result.recipients) {
    let digest = digestByOrg.get(organizationId);
    if (!digest) {
      digest = await buildOrgDigest(organizationId);
      digestByOrg.set(organizationId, digest);
    }

    const { sent } = await sendDigestEmailForUser(userId, userEmail, digest, { markSent });
    if (sent) emailsSent++;
  }

  return { success: true, count: emailsSent };
}
