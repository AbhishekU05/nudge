#!/usr/bin/env node
/**
 * One-time SEO bulk fix for article markdown files.
 * Run: node scripts/seo-fix-articles.mjs
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const articlesDir = path.join(process.cwd(), "public", "articles");

const metadataUpdates = {
  "automated-payment-reminders-when-to-use-them": {
    title: "Automated Payment Reminders — When to Use Them",
    description:
      "Learn when to automate payment reminders vs. follow up manually. Timing, tone, and escalation rules for freelancers and agencies.",
  },
  "client-keeps-paying-late-should-i-fire-them": {
    title: "Client Keeps Paying Late — Should You Fire Them?",
    description:
      "Decide whether to keep a chronically late-paying client. Weigh cash-flow risk, relationship value, and when to walk away.",
  },
  "client-said-theyll-pay-friday-now-what": {
    title: "Client Said They'll Pay Friday — Now What?",
    description:
      "Steps to take when a client promises payment by Friday. Confirm in writing, set reminders, and follow up if they miss the date.",
  },
  "client-said-theyll-pay-next-month-how-do-i-hold-them-to-it": {
    title: "Client Said They'll Pay Next Month — Hold Them to It",
    description:
      "How to hold clients accountable when they push payment to next month. Written confirmation, partial payments, and escalation steps.",
  },
  "freelance-late-payment-statistics-2025": {
    title: "Freelance Late Payment Statistics 2025",
    description:
      "Key 2025 statistics on freelance late payments, cash-flow impact, and why consistent follow-up systems matter for independents.",
  },
  "how-to-ask-for-a-deposit-before-starting-work": {
    title: "How to Ask for a Deposit Before Starting Work",
    description:
      "Scripts and strategies to request upfront deposits from clients without damaging the relationship or losing the project.",
  },
  "how-to-charge-late-fee-as-a-freelancer": {
    title: "How to Charge a Late Fee as a Freelancer",
    description:
      "Set and enforce late payment fees fairly. Contract language, fee structures, and how to communicate penalties professionally.",
  },
  "how-to-check-ar-every-week-without-it-taking-hours": {
    title: "How to Check AR Every Week Without It Taking Hours",
    description:
      "A 20–30 minute weekly AR review process for freelancers and agencies. Prioritize high-risk invoices and skip the spreadsheet chaos.",
  },
  "how-to-escalate-a-late-payment-without-burning-the-relationship": {
    title: "Escalate Late Payments Without Burning the Relationship",
    description:
      "Escalate overdue invoices professionally. Tone progression, documentation, and scripts that protect cash flow and client trust.",
  },
  "how-to-follow-up-on-an-overdue-invoice-professionally": {
    title: "Follow Up on a 60-Day Overdue Invoice Professionally",
    description:
      "Professional follow-up templates and escalation steps for invoices 60+ days overdue. Stay firm without damaging the relationship.",
  },
  "how-to-follow-up-on-an-unpaid-invoice-without-being-awkward": {
    title: "Follow Up on Unpaid Invoices Without Awkwardness",
    description:
      "Practical scripts to chase unpaid invoices without feeling awkward. Tone guidance from first reminder to firm follow-up.",
  },
  "how-to-handle-a-client-who-paid-partially-and-went-silent": {
    title: "Handle a Client Who Paid Partially Then Went Silent",
    description:
      "What to do when a client pays part of an invoice and stops responding. Track balances, follow up, and protect your cash flow.",
  },
  "how-to-manage-accounts-receivables-for-a-small-agency": {
    title: "How to Manage Accounts Receivable for a Small Agency",
    description:
      "Build a repeatable AR process for small agencies. Invoice terms, weekly reviews, payment promises, and escalation workflows.",
  },
  "how-to-pause-work-on-a-client-who-hasnt-paid": {
    title: "How to Pause Work on a Client Who Hasn't Paid",
    description:
      "Pause deliverables professionally when a client hasn't paid. Sample messages, documentation tips, and when to resume work.",
  },
  "how-to-record-a-client-payment-promise": {
    title: "How to Record a Client Payment Promise",
    description:
      "Log client payment commitments with dates and notes. Templates for written confirmation and follow-up on the due date.",
  },
  "how-to-track-payment-promises-from-clients": {
    title: "How to Track Payment Promises From Clients",
    description:
      "Stop losing track of \"I'll pay Friday\" commitments. Systems and tools to record, monitor, and follow up on payment promises.",
  },
  "how-to-track-which-clients-owe-you-money": {
    title: "How to Track Which Clients Owe You Money",
    description:
      "Simple systems to see all outstanding balances at a glance. Spreadsheets vs. collections tools for freelancers and agencies.",
  },
  "how-to-write-a-demand-letter-as-a-consultant": {
    title: "How to Write a Demand Letter as a Consultant",
    description:
      "Write an effective payment demand letter as a consultant. Structure, legal tone, deadlines, and when to escalate beyond email.",
  },
  "late-payment-follow-up-email-templates": {
    title: "Late Payment Follow-Up Email Templates",
    description:
      "Copy-paste email templates from friendly first reminders to firm final notices. Escalation sequence for overdue invoices.",
  },
  "red-flags-that-a-client-wont-pay": {
    title: "Red Flags That a Client Won't Pay",
    description:
      "Spot early warning signs a client may not pay. Red flags in communication, contracts, and behavior — and how to respond.",
  },
  "should-i-keep-working-for-a-client-who-hasnt-paid-me-yet": {
    title: "Should I Keep Working for an Unpaid Client?",
    description:
      "Decide whether to continue work when a client hasn't paid. Risk assessment, pause strategies, and protecting your business.",
  },
  "what-to-say-when-a-client-misses-a-payment-deadline": {
    title: "What to Say When a Client Misses a Payment Deadline",
    description:
      "Exact scripts for when a client misses an invoice due date. Friendly first reminders through firm escalation messages.",
  },
  "what-to-say-when-a-client-misses-their-own-payment-deadline": {
    title: "What to Say When a Client Misses Their Own Deadline",
    description:
      "Follow up when a client breaks a payment promise they made. Direct scripts that re-establish accountability professionally.",
  },
  "tools-for-tracking-outstanding-invoices": {
    title: "10 Tools for Tracking Outstanding Invoices in 2026",
    description:
      "Compare 10 invoice tracking tools for agencies in 2026. Features, pricing, and which fits solo freelancers vs. small teams.",
  },
  "alternatives-to-freshbooks": {
    title: "Top Alternatives to FreshBooks in 2026",
    description:
      "Best FreshBooks alternatives for agencies that need stronger post-invoice collections, not just invoicing and accounting.",
  },
  "best-post-invoice-management-tools-2026": {
    title: "Best Post-Invoice Tools for Small Agencies (2026)",
    description:
      "Compare the best post-invoice management tools for small agencies. Collections tracking, reminders, and payment promise features.",
  },
  "duely-vs-chaser": {
    title: "Duely vs Chaser: Best Tool for Small Agencies",
    description:
      "Duely vs Chaser compared for small agencies. Pricing, features, and which collections tool fits your team size and budget.",
  },
};

const inrReplacements = [
  ["₹1,20,000", "$1,440"],
  ["₹2,00,000", "$2,400"],
  ["₹80,000", "$960"],
  ["₹48,000", "$575"],
  ["₹45,000", "$540"],
  ["₹40,000", "$480"],
  ["₹35,000", "$420"],
  ["₹30,000", "$360"],
  ["₹25,000", "$300"],
  ["₹12,000", "$145"],
  ["₹10,000", "$120"],
  ["₹5 lakh", "$6,000"],
  ["₹4 lakh", "$4,800"],
  ["₹2 lakh", "$2,400"],
  ["₹1 lakh", "$1,200"],
  ["₹2,000", "$25"],
  ["₹1,500", "$18"],
  ["₹1,000", "$12"],
  ["₹50,000", "$600"],
  ["₹90,000", "$1,080"],
  ["₹25,000–₹1 lakh", "$300–$1,200"],
  ["Under ₹25,000", "Under $300"],
  ["Above ₹1 lakh", "Above $1,200"],
];

const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".md"));

for (const file of files) {
  const slug = file.replace(".md", "");
  const filePath = path.join(articlesDir, file);
  let raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);

  if (metadataUpdates[slug]) {
    parsed.data.title = metadataUpdates[slug].title;
    parsed.data.description = metadataUpdates[slug].description;
  }

  if (parsed.data.audience?.includes("Small Agency Owners,,")) {
    parsed.data.audience = parsed.data.audience.replace(
      "Small Agency Owners,, and Consultants",
      "Small Agency Owners, Freelancers, and Consultants",
    );
  }

  let body = parsed.content;

  body = body.replace(/https:\/\/duely\.in\?utm_source=[^\s)]+/g, "https://duely.in");
  body = body.replace(/https:\/\/duely\.in\/\?utm_source=[^\s)]+/g, "https://duely.in");

  for (const [from, to] of inrReplacements) {
    body = body.split(from).join(to);
  }

  raw = matter.stringify(body, parsed.data);
  fs.writeFileSync(filePath, raw);
  console.log(`Fixed: ${slug}`);
}

console.log(`Done. Updated ${files.length} articles.`);
