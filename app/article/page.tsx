import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  SplitSquareVertical,
  BookMarked,
  MessageSquare,
  Bell,
  AlertTriangle,
  Inbox,
  BarChart3,
  Check,
  X,
  Minus,
  ChevronDown,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const painPoints = [
  {
    icon: Inbox,
    title: "Chasing invoices through email threads",
    description:
      "Scrolling back through hundreds of emails just to remember whether a client paid, promised to pay, or went silent. It costs you time you don't have.",
  },
  {
    icon: BarChart3,
    title: "No clear picture of what's outstanding",
    description:
      "Partial payments, disputed amounts, and verbal promises scattered across sticky notes and spreadsheets. You never know the real number until it's too late.",
  },
  {
    icon: AlertTriangle,
    title: "Following up feels uncomfortable",
    description:
      "Drafting every reminder from scratch is exhausting, and getting the tone wrong risks damaging a client relationship you've spent months building.",
  },
];

const features = [
  {
    icon: CreditCard,
    title: "Payment Tracking",
    description:
      "Get a single source of truth for every client balance. Duely tracks the original invoice amount, records payments as they come in, and keeps a running outstanding total at all times. No spreadsheet juggling, no mental arithmetic.",
  },
  {
    icon: SplitSquareVertical,
    title: "Partial Payments",
    description:
      "Real-world clients rarely pay in one shot. Log installments against an invoice and watch the remaining balance update automatically. Every partial payment is timestamped and attributed so your records are always audit-ready.",
  },
  {
    icon: BookMarked,
    title: "Promise Logging",
    description:
      "When a client says \u201cI\u2019ll send it by Friday,\u201d hold them to it. Log the promise with a date and note, and Duely surfaces it when that deadline approaches. Never again lose track of a verbal commitment.",
  },
  {
    icon: MessageSquare,
    title: "Follow-up Drafting with Tone Selection",
    description:
      "Select from friendly, professional, or firm tones and Duely drafts a contextual follow-up message in seconds. The draft references the actual amount owed and days overdue, so every message feels personal—not templated.",
  },
  {
    icon: Bell,
    title: "Automated Reminders",
    description:
      "For clients who need a persistent nudge, enable automated email sequences that run quietly in the background. Sequences pause the moment a payment is recorded and resume only if the balance remains open, keeping your outreach relevant and non-intrusive.",
  },
];

const steps = [
  {
    number: "01",
    title: "Add your clients and invoices",
    description:
      "Import or manually enter client details and outstanding invoice amounts. Duely stores everything in one organised profile per client, accessible in seconds.",
  },
  {
    number: "02",
    title: "Track payments and log conversations",
    description:
      "Record partial payments as they arrive, log promises with due dates, and attach internal notes after every call or email exchange. Your operational memory, always up to date.",
  },
  {
    number: "03",
    title: "Follow up and collect",
    description:
      "Draft tone-matched follow-up messages with one click or activate automated reminder sequences. Duely escalates only when necessary and stops the moment you're paid.",
  },
];

const comparisonRows = [
  { label: "Partial payment tracking", duely: true, manual: false, generic: false },
  { label: "Promise logging with due dates", duely: true, manual: false, generic: false },
  { label: "Tone-based follow-up drafting", duely: true, manual: false, generic: false },
  { label: "Automated reminder sequences", duely: true, manual: false, generic: true },
  { label: "Client notes per profile", duely: true, manual: true, generic: false },
  { label: "Outstanding balance view", duely: true, manual: true, generic: true },
  { label: "Collections pipeline view", duely: true, manual: false, generic: false },
];

const testimonials = [
  {
    initials: "RK",
    name: "Rohit Kapoor",
    role: "Founder, Kapoor Creative Studio",
    quote:
      "Before Duely I was copy-pasting reminder emails from a notes app. Now I draft a perfect follow-up in under a minute and actually know who owes me what. It's saved us at least ₹2L in delayed collections this quarter alone.",
  },
  {
    initials: "PM",
    name: "Priya Mehta",
    role: "Operations Lead, Pixel Forge Agency",
    quote:
      "The promise logging feature is the one thing I didn't know I needed. Clients would commit to a date verbally and we'd forget. Now it's logged, dated, and visible. Our follow-up rate went from ad-hoc to consistent overnight.",
  },
  {
    initials: "AS",
    name: "Arjun Singh",
    role: "Independent Consultant",
    quote:
      "I run solo and chasing payments was eating into billable hours. Automated reminders handle the quiet follow-ups while I focus on client work. When things escalate, I switch to manual and the tone selector makes those conversations much less awkward.",
  },
];

const faqs = [
  {
    q: "What exactly does Duely do?",
    a: "Duely is a lightweight collections workflow tool for service businesses. It helps you track outstanding invoices, log partial payments, record client promises, draft follow-up messages, and automate reminder sequences—all in one place without the bloat of full accounting software.",
  },
  {
    q: "Is Duely a replacement for my accounting software?",
    a: "No. Duely is purpose-built for the post-invoice collections workflow, not bookkeeping. Think of it as the operational layer that sits on top of your invoicing tool—focused entirely on helping you collect what's already owed.",
  },
  {
    q: "How does the tone selection for follow-ups work?",
    a: "When drafting a follow-up, you choose from three tones: Friendly (warm, non-confrontational), Professional (neutral, business-standard), or Firm (direct, emphasises urgency). Duely generates a message that references the client's actual balance and days overdue, so every draft is contextual rather than generic.",
  },
  {
    q: "Can I stop automated reminders for a specific client?",
    a: "Yes. Automated sequences can be paused, stopped, or adjusted per client at any time. They also pause automatically the moment you log a payment against that client's balance, so you never accidentally send a reminder to someone who just paid.",
  },
  {
    q: "How does partial payment tracking work?",
    a: "When a client makes an installment, you record the payment amount and date in Duely. The platform subtracts it from the outstanding balance and keeps a full payment history. You can see exactly how much has been received, when, and what still remains.",
  },
  {
    q: "Is my data secure?",
    a: "All data is stored in a Supabase-backed database with row-level security enabled, meaning each user can only access their own records. Communication with the server is encrypted in transit over HTTPS, and no payment card data is stored on Duely's infrastructure.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function CellIcon({ value }: { value: boolean | "partial" }) {
  if (value === true)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  if (value === "partial")
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
        <Minus className="h-3.5 w-3.5" />
      </span>
    );
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-zinc-600">
      <X className="h-3.5 w-3.5" />
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArticleTemplatePage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              width={32}
              height={32}
              alt="Duely Logo"
              className="h-8 w-8 rounded-md"
            />
            <span className="text-2xl font-semibold tracking-tight text-zinc-50">Duely</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </Container>
      </header>

      <main className="flex-1">

        {/* ── 1. Hero ── */}
        <section className="border-b border-white/5 bg-gradient-to-b from-indigo-950/20 to-transparent">
          <Container className="py-20 sm:py-28 text-center">
            <Badge variant="default" className="mb-6 bg-white/[0.03] text-zinc-400 border-white/10">
              Collections &amp; Payment Workflow
            </Badge>
            <h1 className="mx-auto max-w-3xl text-pretty text-5xl font-semibold tracking-[-0.045em] text-zinc-50 sm:text-6xl">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-400">
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
              cillum dolore eu fugiat nulla pariatur.
            </p>
            <div className="mt-10 flex items-center justify-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 transition-all"
                >
                  Start collecting payments
                </Button>
              </Link>
            </div>
          </Container>
        </section>

        {/* ── 2. Problem ── */}
        <section className="border-b border-white/5">
          <Container className="py-20 sm:py-28">
            <div className="mx-auto max-w-2xl text-center mb-14">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 mb-4">
                The problem
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Collections management is broken for small teams
              </h2>
              <p className="mt-4 text-zinc-400 leading-7">
                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
                consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {painPoints.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-7 transition-colors hover:border-white/[0.12]"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 font-semibold text-zinc-100">{title}</h3>
                  <p className="text-sm leading-6 text-zinc-400">{description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── 3. Feature Breakdown ── */}
        <section className="border-b border-white/5 bg-white/[0.01]">
          <Container className="py-20 sm:py-28">
            <div className="mx-auto max-w-2xl text-center mb-14">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 mb-4">
                Features
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Everything you need. Nothing you don't.
              </h2>
              <p className="mt-4 text-zinc-400 leading-7">
                At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis
                praesentium voluptatum deleniti atque corrupti quos dolores.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }, i) => (
                <div
                  key={title}
                  className={`rounded-2xl border border-white/[0.07] bg-white/[0.025] p-7 transition-colors hover:border-indigo-500/30 hover:bg-white/[0.04] ${
                    i === 4 ? "sm:col-span-2 lg:col-span-1" : ""
                  }`}
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-3 font-semibold text-zinc-100">{title}</h3>
                  <p className="text-sm leading-6 text-zinc-400">{description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── 4. How It Works ── */}
        <section className="border-b border-white/5">
          <Container className="py-20 sm:py-28">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 mb-4">
                How it works
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Up and running in three steps
              </h2>
              <p className="mt-4 text-zinc-400 leading-7">
                Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe
                eveniet ut et voluptates repudiandae sint et molestiae non recusandae.
              </p>
            </div>

            <div className="relative grid gap-0 sm:grid-cols-3">
              {/* connecting line */}
              <div className="absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] hidden h-px bg-gradient-to-r from-indigo-500/30 via-indigo-500/10 to-indigo-500/30 sm:block" />

              {steps.map(({ number, title, description }) => (
                <div key={number} className="relative flex flex-col items-center px-6 text-center">
                  <div className="relative z-10 mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-950/60 shadow-lg shadow-indigo-900/20">
                    <span className="text-2xl font-bold tracking-tight text-indigo-300">
                      {number}
                    </span>
                  </div>
                  <h3 className="mb-3 font-semibold text-zinc-100">{title}</h3>
                  <p className="text-sm leading-6 text-zinc-400">{description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── 5. Comparison Table ── */}
        <section className="border-b border-white/5 bg-white/[0.01]">
          <Container className="py-20 sm:py-28">
            <div className="mx-auto max-w-2xl text-center mb-14">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 mb-4">
                Comparison
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Duely vs. the alternatives
              </h2>
              <p className="mt-4 text-zinc-400 leading-7">
                Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus
                maiores alias consequatur aut perferendis doloribus asperiores repellat.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
              <table className="w-full min-w-[540px] text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.03]">
                    <th className="py-4 pl-6 pr-4 text-left font-medium text-zinc-400">Feature</th>
                    <th className="py-4 px-4 text-center font-semibold text-indigo-300">Duely</th>
                    <th className="py-4 px-4 text-center font-medium text-zinc-400">Manual tracking</th>
                    <th className="py-4 px-4 text-center font-medium text-zinc-400">Generic tools</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map(({ label, duely, manual, generic }, i) => (
                    <tr
                      key={label}
                      className={`border-b border-white/[0.05] transition-colors hover:bg-white/[0.02] ${
                        i === comparisonRows.length - 1 ? "border-0" : ""
                      }`}
                    >
                      <td className="py-4 pl-6 pr-4 text-zinc-300">{label}</td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex justify-center">
                          <CellIcon value={duely} />
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex justify-center">
                          <CellIcon value={manual} />
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex justify-center">
                          <CellIcon value={generic} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Container>
        </section>

        {/* ── 6. Testimonials ── */}
        <section className="border-b border-white/5">
          <Container className="py-20 sm:py-28">
            <div className="mx-auto max-w-2xl text-center mb-14">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 mb-4">
                Testimonials
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Trusted by teams collecting every day
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {testimonials.map(({ initials, name, role, quote }) => (
                <div
                  key={name}
                  className="flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-7 transition-colors hover:border-white/[0.12]"
                >
                  <p className="mb-6 text-sm leading-7 text-zinc-300 italic">"{quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/20">
                      <span className="text-xs font-semibold">{initials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{name}</p>
                      <p className="text-xs text-zinc-500">{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── 7. FAQ ── */}
        <section className="border-b border-white/5 bg-white/[0.01]">
          <Container className="py-20 sm:py-28">
            <div className="mx-auto max-w-2xl text-center mb-14">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 mb-4">
                FAQ
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Common questions
              </h2>
            </div>

            <div className="mx-auto max-w-2xl divide-y divide-white/[0.07]">
              {faqs.map(({ q, a }) => (
                <details key={q} className="group py-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-zinc-200 list-none [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-zinc-400">{a}</p>
                </details>
              ))}
            </div>
          </Container>
        </section>

        {/* ── 8. Final CTA ── */}
        <section>
          <Container className="py-20 sm:py-28">
            <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-gradient-to-b from-indigo-950/30 to-transparent px-8 py-16 text-center sm:px-14 sm:py-20">
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Ready to stop chasing and start collecting?
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-zinc-400">
                Excepteur sint occaecat cupidatat non proident. Sunt in culpa qui officia deserunt
                mollit anim id est laborum. Join hundreds of service businesses already using Duely.
              </p>
              <div className="mt-10">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 transition-all"
                  >
                    Create your free account
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border mt-auto">
        <Container className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 text-sm text-zinc-600">
          <div>© {new Date().getFullYear()} Duely. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <span>Contact us:</span>
              <a
                href="mailto:support@duely.in"
                className="font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                support@duely.in
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
