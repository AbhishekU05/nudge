export type EntityDefinition = {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  definition: string;
  keyPoints: string[];
  relatedLinks: { label: string; href: string }[];
};

export const entityDefinitions: EntityDefinition[] = [
  {
    slug: "duely",
    title: "What Is Duely?",
    metaDescription:
      "Duely is a collections management tool for freelancers and agencies. Track invoices, payment promises, and send reminders from your own Gmail.",
    h1: "What Is Duely?",
    definition:
      "Duely is a collections management tool built for freelancers, small agency owners, and independent consultants. It sits between sending an invoice and receiving payment, helping you track outstanding balances, log partial payments, record client payment promises, draft follow-up messages, and send automated reminders from your own Gmail address.",
    keyPoints: [
      "Tracks outstanding invoices and partial payments in one dashboard",
      "Records client payment promises with due dates and notes",
      "Drafts follow-up messages in friendly, professional, or firm tones",
      "Sends automated reminders from your own Gmail, not a third-party sender",
      "Integrates with QuickBooks, Xero, and Stripe (Beta)",
      "Pricing: 7-day free trial, then $29/month Pro plan",
    ],
    relatedLinks: [
      { label: "Duely vs Chaser comparison", href: "/articles/duely-vs-chaser" },
      { label: "Best post-invoice tools", href: "/articles/best-post-invoice-management-tools-2026" },
      { label: "Start free trial", href: "/signup" },
    ],
  },
  {
    slug: "post-invoice-collections",
    title: "What Is Post-Invoice Collections?",
    metaDescription:
      "Post-invoice collections is the process of tracking unpaid invoices and following up until payment is received. Learn how agencies manage it.",
    h1: "What Is Post-Invoice Collections?",
    definition:
      "Post-invoice collections is the operational workflow that begins after an invoice is sent and ends when payment is received in full. It includes tracking invoice status, sending payment reminders, logging client payment promises, recording partial payments, escalating overdue accounts, and maintaining a communication history for each client.",
    keyPoints: [
      "Covers everything after invoice delivery: reminders, promises, and escalation",
      "Distinct from invoicing (creating bills) and accounting (bookkeeping)",
      "Most freelancers and small agencies handle collections manually without a dedicated system",
      "Consistent follow-up reduces average days-to-payment without damaging relationships",
      "Tools like Duely automate the tracking and reminder layer without replacing your accounting software",
    ],
    relatedLinks: [
      { label: "How to manage accounts receivable", href: "/articles/how-to-manage-accounts-receivables-for-a-small-agency" },
      { label: "Automated payment reminders guide", href: "/articles/automated-payment-reminders-when-to-use-them" },
      { label: "Late payment follow-up templates", href: "/articles/late-payment-follow-up-email-templates" },
    ],
  },
  {
    slug: "payment-promise-tracking",
    title: "What Is Payment Promise Tracking?",
    metaDescription:
      "Payment promise tracking records when a client commits to pay by a specific date. Learn why it matters and how to hold clients accountable.",
    h1: "What Is Payment Promise Tracking?",
    definition:
      "Payment promise tracking is the practice of recording when a client verbally or in writing commits to pay an invoice by a specific date. It includes the promised amount, the due date, the communication channel, and any conditions attached. Tracking promises prevents follow-ups from being lost across email threads and gives you a clear record when a client misses their own deadline.",
    keyPoints: [
      "Clients often say \"I'll pay Friday\" or \"next month\" — these must be logged immediately",
      "A payment promise is not payment; it is a commitment that requires follow-up on the due date",
      "Broken promises are a stronger escalation signal than a simple overdue invoice",
      "Confirming promises in writing reduces disputes about what was agreed",
      "Duely stores promises alongside invoice balances and follow-up history per client",
    ],
    relatedLinks: [
      { label: "How to record a payment promise", href: "/articles/how-to-record-a-client-payment-promise" },
      { label: "How to track payment promises", href: "/articles/how-to-track-payment-promises-from-clients" },
      { label: "Client said they'll pay Friday", href: "/articles/client-said-theyll-pay-friday-now-what" },
    ],
  },
  {
    slug: "accounts-receivable-for-agencies",
    title: "Accounts Receivable for Agencies",
    metaDescription:
      "Accounts receivable for agencies is money clients owe for completed work. Learn how small agencies track AR and reduce payment delays.",
    h1: "What Is Accounts Receivable for Agencies?",
    definition:
      "Accounts receivable (AR) for agencies is the total amount of money clients owe for work that has been invoiced but not yet paid. For small marketing, design, web, and content agencies, AR management includes sending invoices promptly, tracking overdue balances, following up consistently, documenting payment promises, and reviewing outstanding amounts weekly to protect cash flow.",
    keyPoints: [
      "AR represents real revenue that has been earned but not yet collected",
      "Small agencies often have 30–60% of invoices overdue at any given time",
      "Weekly AR reviews take 20–30 minutes with a structured process",
      "High-value overdue invoices should receive priority follow-up attention",
      "Dedicated collections tools reduce the time founders spend chasing payments manually",
    ],
    relatedLinks: [
      { label: "How to manage AR for a small agency", href: "/articles/how-to-manage-accounts-receivables-for-a-small-agency" },
      { label: "Weekly AR check in under 30 minutes", href: "/articles/how-to-check-ar-every-week-without-it-taking-hours" },
      { label: "Track which clients owe you money", href: "/articles/how-to-track-which-clients-owe-you-money" },
    ],
  },
];

export function getEntityBySlug(slug: string): EntityDefinition | undefined {
  return entityDefinitions.find((entity) => entity.slug === slug);
}
