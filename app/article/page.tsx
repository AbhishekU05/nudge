import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { HeroEmailCapture } from "@/components/site/hero-email-capture";
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
    title: "Lorem ipsum dolor sit amet",
    description:
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore.",
  },
  {
    icon: BarChart3,
    title: "Nemo enim ipsam voluptatem",
    description:
      "Quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt neque porro quisquam.",
  },
  {
    icon: AlertTriangle,
    title: "Quis autem vel eum iure",
    description:
      "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur aut incidunt.",
  },
];

const features = [
  {
    icon: CreditCard,
    title: "Lorem Ipsum Dolor",
    description:
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi.",
  },
  {
    icon: SplitSquareVertical,
    title: "Consectetur Adipiscing",
    description:
      "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
  },
  {
    icon: BookMarked,
    title: "Eiusmod Tempor Incididunt",
    description:
      "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi.",
  },
  {
    icon: MessageSquare,
    title: "Labore Et Dolore Magna",
    description:
      "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.",
  },
  {
    icon: Bell,
    title: "Ullamco Laboris Nisi",
    description:
      "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae itaque earum.",
  },
];

const steps = [
  {
    number: "01",
    title: "Lorem ipsum dolor sit amet",
    description:
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis.",
  },
  {
    number: "02",
    title: "Nemo enim ipsam voluptatem",
    description:
      "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet consectetur adipisci velit sed quia non numquam eius modi tempora incidunt ut labore et dolore.",
  },
  {
    number: "03",
    title: "Quis autem vel eum iure",
    description:
      "Ut enim ad minima veniam quis nostrum exercitationem ullam corporis suscipit laboriosam nisi ut aliquid ex ea commodi consequatur aut incidunt magnam aliquam.",
  },
];

const comparisonRows = [
  { label: "Lorem ipsum dolor sit", duely: true, manual: false, generic: false },
  { label: "Consectetur adipiscing elit", duely: true, manual: false, generic: false },
  { label: "Sed do eiusmod tempor", duely: true, manual: false, generic: false },
  { label: "Incididunt ut labore dolore", duely: true, manual: false, generic: true },
  { label: "Ut enim ad minim veniam", duely: true, manual: true, generic: false },
  { label: "Quis nostrud exercitation", duely: true, manual: true, generic: true },
  { label: "Ullamco laboris nisi aliquip", duely: true, manual: false, generic: false },
];

const testimonials = [
  {
    initials: "LI",
    name: "Lorem Ipsum",
    role: "Dolor Sit, Amet Consectetur",
    quote:
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis.",
  },
  {
    initials: "NE",
    name: "Nemo Enim",
    role: "Voluptatem, Quia Voluptas Agency",
    quote:
      "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi occaecati.",
  },
  {
    initials: "QA",
    name: "Quis Autem",
    role: "Vel Eum Iure Consultant",
    quote:
      "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae itaque earum.",
  },
];

const faqs = [
  {
    q: "Lorem ipsum dolor sit amet consectetur?",
    a: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
  },
  {
    q: "Nemo enim ipsam voluptatem quia?",
    a: "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet consectetur adipisci velit sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.",
  },
  {
    q: "Ut enim ad minima veniam quis nostrum?",
    a: "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur vel illum qui dolorem eum fugiat quo voluptas nulla pariatur omnis dolor repellendus.",
  },
  {
    q: "Temporibus autem quibusdam et aut officiis?",
    a: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
  },
  {
    q: "Itaque earum rerum hic tenetur a sapiente?",
    a: "Nam libero tempore cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus omnis voluptas assumenda est omnis dolor repellendus temporibus.",
  },
  {
    q: "Similique sunt in culpa qui officia deserunt?",
    a: "Et harum quidem rerum facilis est et expedita distinctio nam libero tempore cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.",
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
              Lorem Ipsum Dolor Sit
            </Badge>
            <h1 className="mx-auto max-w-3xl text-pretty text-5xl font-semibold tracking-[-0.045em] text-zinc-50 sm:text-6xl">
              Lorem ipsum dolor sit amet consectetur adipiscing elit sed
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-400">
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
              cillum dolore eu fugiat nulla pariatur.
            </p>
            <div className="mt-10 max-w-lg mx-auto w-full">
              <HeroEmailCapture />
            </div>
          </Container>
        </section>

        {/* ── 2. Problem ── */}
        <section className="border-b border-white/5">
          <Container className="py-20 sm:py-28">
            <div className="mx-auto max-w-2xl text-center mb-14">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 mb-4">
                Lorem ipsum
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Nemo enim ipsam voluptatem quia voluptas
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
                Lorem ipsum
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                At vero eos et accusamus iusto odio dignissimos
              </h2>
              <p className="mt-4 text-zinc-400 leading-7">
                Blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas
                molestias excepturi sint occaecati cupiditate non provident.
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
                Lorem ipsum
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Temporibus autem quibusdam et aut officiis
              </h2>
              <p className="mt-4 text-zinc-400 leading-7">
                Debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint
                et molestiae non recusandae itaque earum rerum hic tenetur a sapiente.
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
                Lorem ipsum
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Lorem ipsum dolor sit amet consectetur
              </h2>
              <p className="mt-4 text-zinc-400 leading-7">
                Itaque earum rerum hic tenetur a sapiente delectus ut aut reiciendis voluptatibus
                maiores alias consequatur aut perferendis doloribus asperiores repellat.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
              <table className="w-full min-w-[540px] text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.03]">
                    <th className="py-4 pl-6 pr-4 text-left font-medium text-zinc-400">Lorem ipsum</th>
                    <th className="py-4 px-4 text-center font-semibold text-indigo-300">Dolor sit</th>
                    <th className="py-4 px-4 text-center font-medium text-zinc-400">Amet consectetur</th>
                    <th className="py-4 px-4 text-center font-medium text-zinc-400">Adipiscing elit</th>
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
                Lorem ipsum
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Neque porro quisquam est qui dolorem ipsum
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
                Lorem ipsum
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Sed ut perspiciatis unde omnis iste natus
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
                Lorem ipsum dolor sit amet consectetur adipiscing
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-zinc-400">
                Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt
                mollit anim id est laborum nemo enim ipsam voluptatem quia voluptas sit.
              </p>
              <div className="mt-10">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 transition-all"
                  >
                    Lorem ipsum dolor
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
