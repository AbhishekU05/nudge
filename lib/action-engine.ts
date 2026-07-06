import { ClientRecord, InvoiceRecord, getRemainingBalance, getDaysOverdue } from "./types";

export type ActionCategory = "critical" | "moderate" | "chill" | "system" | "hidden";

export type ActionRecommendation = 
  | "firm_nudge"
  | "friendly_checkin"
  | "light_nudge"
  | "enroll_automation"
  | "global_automation"
  | "reply_needed";

export type ActionTask = {
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  primaryInvoiceId: string;
  score: number;
  category: ActionCategory;
  recommendation: ActionRecommendation;
  contextText: string;
  totalOwed: number;
  maxDaysOverdue: number;
  isCooldown: boolean;
  currency: string;
};

// Evaluate a single client's invoices
export function evaluateClient(
  client: ClientRecord,
  invoices: InvoiceRecord[],
  totalUserAR: number
): ActionTask | null {
  const activeInvoices = invoices.filter(
    (inv) => 
      inv.workflow_status !== "paid" && 
      inv.workflow_status !== "written_off" && 
      getRemainingBalance(inv) > 0
  );

  if (activeInvoices.length === 0) return null; // Nothing to do

  // 1. Immutable Facts
  let maxDaysOverdue = 0;
  let clientTotalOwed = 0;
  let hasBrokenPromise = false;
  let hasActiveDispute = false;
  let lastContactDaysAgo: number | null = null;
  let primaryInvoiceId = activeInvoices[0].id;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (const inv of activeInvoices) {
    clientTotalOwed += getRemainingBalance(inv);
    const overdue = getDaysOverdue(inv) || 0;
    
    // Always prioritize the invoice with a broken promise
    if (inv.workflow_status === "promised" && inv.promised_date) {
      const promiseDate = new Date(inv.promised_date);
      promiseDate.setHours(0, 0, 0, 0);
      if (promiseDate < now) {
        hasBrokenPromise = true;
        primaryInvoiceId = inv.id;
      }
    }
    
    // Otherwise, prioritize the oldest overdue invoice
    if (overdue > maxDaysOverdue) {
      maxDaysOverdue = overdue;
      if (!hasBrokenPromise) {
        primaryInvoiceId = inv.id;
      }
    }
    
    // Check internal notes for 'dispute' as a simple proxy for disputed state
    if (inv.internal_notes && inv.internal_notes.toLowerCase().includes("dispute")) {
      hasActiveDispute = true;
    }

    // Cooldown check (Automated emails)
    if (inv.last_sent_at) {
      const sentAt = new Date(inv.last_sent_at);
      sentAt.setHours(0, 0, 0, 0);
      const diff = Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24));
      if (lastContactDaysAgo === null || diff < lastContactDaysAgo) {
        lastContactDaysAgo = diff;
      }
    }

    // Cooldown check (Manual follow-ups)
    if (inv.followup_history && inv.followup_history.length > 0) {
      for (const log of inv.followup_history) {
        const followupDate = new Date(log.followup_date || log.created_at);
        followupDate.setHours(0, 0, 0, 0);
        const diff = Math.floor((now.getTime() - followupDate.getTime()) / (1000 * 60 * 60 * 24));
        if (lastContactDaysAgo === null || diff < lastContactDaysAgo) {
          lastContactDaysAgo = diff;
        }
      }
    }
  }

  // Edge Case: Disputes
  if (hasActiveDispute) {
    return {
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      primaryInvoiceId,
      score: 0,
      category: "hidden",
      recommendation: "friendly_checkin",
      contextText: "Hidden due to active dispute.",
      totalOwed: clientTotalOwed,
      maxDaysOverdue,
      isCooldown: true,
      currency: activeInvoices[0]?.currency || "USD"
    };
  }

  // Score Calculation
  let score = 0;

  // A. Aging (Max 50)
  if (maxDaysOverdue >= 31) score += 50;
  else if (maxDaysOverdue >= 15) score += 40;
  else if (maxDaysOverdue >= 4) score += 25;
  else if (maxDaysOverdue >= 1) score += 10;
  else return null; // Not overdue yet

  // B. Financial Risk (Max 30)
  if (totalUserAR > 0) {
    const percentage = clientTotalOwed / totalUserAR;
    if (percentage > 0.15) score += 30;
    else if (percentage >= 0.05) score += 15;
  }

  // C. Broken Promise (+50)
  if (hasBrokenPromise) {
    score += 50;
  }

  // Edge Case: Automations
  const isAutoPilot = client.active; // True if enrolled in automation
  
  // Cooldown Logic
  let isCooldown = false;
  let contextText = "";
  let recommendation: ActionRecommendation = "friendly_checkin";

  if (lastContactDaysAgo !== null) {
    let requiredCooldown = 0;
    if (maxDaysOverdue >= 31) requiredCooldown = 1;
    else if (maxDaysOverdue >= 11) requiredCooldown = 3;
    else requiredCooldown = 5;

    if (lastContactDaysAgo < requiredCooldown) {
      isCooldown = true;
      score = -100; // Drop from active queue
    }
  }

  // Cap the score
  score = Math.min(Math.max(score, -100), 100);

  // Determine Category
  let category: ActionCategory = "chill";
  if (isAutoPilot && !hasBrokenPromise) {
    category = "hidden";
    contextText = "Automation is handling this.";
  } else if (isCooldown) {
    category = "hidden";
    contextText = `You followed up recently. Cooldown active.`;
  } else if (score >= 70) {
    category = "critical";
    recommendation = "firm_nudge";
    if (hasBrokenPromise) {
      contextText = `Send a firm follow-up. ${client.name} broke a payment promise.`;
    } else {
      contextText = `Send a firm follow-up. ${client.name} is ${maxDaysOverdue} days late on a significant balance.`;
    }
  } else if (score >= 35) {
    category = "moderate";
    recommendation = "friendly_checkin";
    contextText = `Send a friendly check-in. ${client.name} is ${maxDaysOverdue} days late.`;
  } else {
    category = "chill";
    recommendation = "light_nudge";
    contextText = `Send a light nudge. ${client.name} is only ${maxDaysOverdue} days late.`;
  }

  return {
    clientId: client.id,
    clientName: client.name,
    clientEmail: client.email,
    primaryInvoiceId,
    score,
    category,
    recommendation,
    contextText,
    totalOwed: clientTotalOwed,
    maxDaysOverdue,
    isCooldown,
    currency: activeInvoices[0]?.currency || "USD"
  };
}

export function generateActionPlan(clients: ClientRecord[], allInvoices: InvoiceRecord[]): ActionTask[] {
  const activeInvoices = allInvoices.filter(
    (inv) => 
      inv.workflow_status !== "paid" && 
      inv.workflow_status !== "written_off" && 
      getRemainingBalance(inv) > 0 &&
      getDaysOverdue(inv) !== null
  );

  const totalUserAR = activeInvoices.reduce((sum, inv) => sum + getRemainingBalance(inv), 0);

  const tasks: ActionTask[] = [];

  for (const client of clients) {
    const clientInvoices = allInvoices.filter(inv => inv.client_id === client.id || inv.customer_id === client.id);
    if (clientInvoices.length > 0) {
      const task = evaluateClient(client, clientInvoices, totalUserAR);
      if (task) {
        tasks.push(task);
      }
    }
  }

  // Check for System & Workflow Recommendations (Pattern C: Global Minor Offender)
  const chillTasks = tasks.filter(t => t.category === "chill" && !t.isCooldown);
  if (chillTasks.length >= 5) {
    tasks.push({
      clientId: "system-recommendation-1",
      clientName: "System Recommendation",
      clientEmail: null,
      primaryInvoiceId: "system",
      score: 100, // Show at top
      category: "system",
      recommendation: "global_automation",
      contextText: "You have 5+ clients mildly overdue right now. Turn on 'Global Gentle Reminders' to handle these early nudges for you.",
      totalOwed: 0,
      maxDaysOverdue: 0,
      isCooldown: false,
      currency: "USD"
    });
  }

  // Sort by score descending
  return tasks.sort((a, b) => b.score - a.score);
}
