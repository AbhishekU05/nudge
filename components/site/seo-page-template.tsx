import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ArrowRight, MessageSquare, Sparkles, Zap, CreditCard, User, Users, AlertTriangle, Activity, Mail, AlertCircle, Clock, DollarSign } from "lucide-react";
import type { SEOPageData } from "@/lib/seo-data";
import { Container } from "@/components/site/container";
import { FadeIn, Reveal, SlideUp, SlideIn } from "@/components/site/scroll-animation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeroActionCenter } from "@/components/site/hero-action-center";
import { cn } from "@/lib/utils";

export default function SEOPageTemplate({ data }: { data: SEOPageData }) {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "Duely",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "WebBrowser",
        "offers": {
          "@type": "Offer",
          "price": "29.00",
          "priceCurrency": "USD"
        },
        "description": data.metaDescription,
        "url": "https://duely.in"
      }
    ] as any[]
  };

  if (data.category && data.slug) {
    let categoryName = data.category.charAt(0).toUpperCase() + data.category.slice(1);
    let categoryPath = `/${data.category}`;
    if (data.category === 'competitor') { categoryName = 'Alternatives'; categoryPath = '/alternatives'; }
    if (data.category === 'industry') { categoryName = 'Industries'; categoryPath = '/for'; }
    if (data.category === 'integration') { categoryName = 'Integrations'; categoryPath = '/integrations'; }
    if (data.category === 'location') { categoryName = 'Locations'; categoryPath = '/location'; }
    if (data.category === 'use-case') { categoryName = 'Use Cases'; categoryPath = '/use-case'; }

    schemaMarkup["@graph"].push({
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://duely.in" },
        { "@type": "ListItem", "position": 2, "name": categoryName, "item": `https://duely.in${categoryPath}` },
        { "@type": "ListItem", "position": 3, "name": data.title, "item": `https://duely.in/${data.slug}` }
      ]
    });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }} />
      <main className="flex-1">

        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-32 lg:pb-40">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(79,70,229,0.15),transparent_60%),radial-gradient(ellipse_at_80%_40%,rgba(168,85,247,0.08),transparent_50%)]" />

          <Container>
            <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <FadeIn className="max-w-2xl">
                <h1 className="mt-8 text-pretty text-5xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-6xl lg:text-7xl lg:leading-[1.05]">{data.h1}</h1>
                <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400">{data.subtitle}</p>
                <p className="mt-4 max-w-xl text-pretty text-base font-medium text-zinc-300">Start your 7-day free trial. No credit card required.</p>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-indigo-500/20 w-full sm:w-auto">
                      {data.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/tools" className="w-full sm:w-auto">
                    <Button variant="secondary" size="lg" className="h-12 px-8 text-base w-full sm:w-auto">
                      Explore free tools
                    </Button>
                  </Link>
                </div>
              </FadeIn>

              <Reveal delay={0.2} className="relative z-10 lg:ml-auto w-full max-w-[640px] lg:max-w-none">
                <HeroActionCenter />
              </Reveal>
            </div>
          </Container>
        </section>

        
        {data.painPoint && (
          <section className="py-20 bg-zinc-950/50 border-y border-white/5 backdrop-blur-sm">
            <Container>
              <FadeIn className="max-w-3xl mx-auto">
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50" />
                  <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-100 mb-6">The Real Problem</h2>
                  <p className="text-lg text-zinc-400 leading-relaxed">
                    {data.painPoint}
                  </p>
                </div>
              </FadeIn>
            </Container>
          </section>
        )}

        {data.features && data.features.length > 0 && (
          <section className="py-24">
            <Container>
              <div className="max-w-5xl mx-auto">
                <FadeIn className="text-center mb-16">
                  <h2 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-100 mb-4">Why Duely is Built for You</h2>
                  <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                    We focus on one thing: getting your overdue invoices paid without ruining your client relationships.
                  </p>
                </FadeIn>
                <FadeIn className="grid md:grid-cols-3 gap-8 mb-24">
                  {data.features.map((feature, index) => (
                    <div key={index} className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.04] transition-colors">
                      <div className="h-12 w-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20">
                        <CheckCircle2 className="h-6 w-6 text-indigo-400" />
                      </div>
                      <p className="text-zinc-300 font-medium leading-relaxed">{feature}</p>
                    </div>
                  ))}
                </FadeIn>
              </div>
            </Container>
          </section>
        )}

        {/* STATS SECTION */}
        <section className="py-16 sm:py-20">
          <Container>
            <FadeIn>
              <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8 lg:gap-16 mx-auto max-w-4xl text-center">
                {[
                  {
                    stat: "$40B+",
                    label: "The global cost",
                    description: "Lost globally every year to late payments",
                    source: "World Bank",
                  },
                  {
                    stat: "50%",
                    label: "The default rate",
                    description: "of US B2B invoices are currently overdue",
                    source: "Atradius 2024",
                  },
                  {
                    stat: "52%",
                    label: "The silent write-off",
                    description: "of small businesses give up chasing payments to avoid the awkwardness",
                    source: "GoCardless / FSB 2025",
                  },
                ].map((item) => (
                  <div key={item.stat}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                      {item.label}
                    </p>
                    <p className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
                      {item.stat}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                      {item.description}
                    </p>
                    <p className="mt-2 text-xs text-zinc-600">
                      {item.source}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </Container>
        </section>

        {/* CORE FOUR SECTIONS */}
        <section id="how-it-works" className="relative overflow-hidden py-24 sm:py-32 space-y-32 sm:space-y-40 bg-zinc-950/50 border-y border-white/5 backdrop-blur-sm">
          <div id="features" className="absolute -top-32" />

          {/* 1. Action Center */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <SlideIn left>
                <div className="relative order-2 lg:order-1">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.06),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-4 shadow-xl shadow-black/20">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold tracking-tight text-zinc-50 flex items-center gap-2">
                            <Users className="h-5 w-5 text-zinc-400" /> Customers Action Needed
                          </h2>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.025] hover:bg-white/[0.05] transition-colors">
                            <div>
                              <h3 className="font-medium text-zinc-200">Acme Corp</h3>
                              <p className="text-sm text-zinc-500 mt-0.5">
                                <span className="text-red-400">14 days overdue</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-zinc-200">$15,400.00</div>
                              <div className="text-sm text-zinc-500 mt-0.5">Remaining</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
              <FadeIn delay={0.2} className="order-1 lg:order-2 max-w-xl lg:pl-12 xl:pl-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 mb-6">
                  <Zap className="h-6 w-6 text-red-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  You log in to 14 overdue invoices. Which one is actually a fire?
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Stop guessing who to chase. The Action Center analyzes aging, financial risk, and broken promises to tell you exactly who needs a nudge today, and who can wait.
                </p>
              </FadeIn>
            </div>
          </Container>

          {/* 2. Tone Drafting */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12 xl:pr-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 mb-6">
                  <MessageSquare className="h-6 w-6 text-purple-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Too friendly and they ignore it. Too firm and you damage the relationship.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Pick a tone. Duely drafts the perfect message based on invoice history. Edit it before you send.
                </p>
              </FadeIn>
              <SlideIn right>
                <div className="relative">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.06),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-4 shadow-xl shadow-black/20">
                    <CardContent className="p-0 space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-lg font-bold tracking-tight text-zinc-50">Queue</h2>
                        <div className="bg-white/5 px-2 py-0.5 rounded text-xs text-zinc-400">1 waiting</div>
                      </div>
                      <div className="flex flex-col p-4 rounded-xl border border-white/10 bg-white/[0.025] transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-zinc-200">Friendly check-in regarding Invoice #INV-2024-08</h3>
                            <p className="text-xs text-zinc-500 mt-1">To: david@acmecorp.com</p>
                          </div>
                          <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded">Draft</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
            </div>
          </Container>

          {/* 3. Gmail Integration */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <SlideIn left>
                <div className="relative order-2 lg:order-1">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-6 shadow-xl shadow-black/20">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-sm">
                          <Image src="/google-logo.svg" alt="Google" width={24} height={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-100">Google Gmail</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </span>
                            <span className="text-sm text-emerald-400 font-medium">
                              Connected to abhishek@agency.com
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                          <div>
                            <p className="text-sm font-medium text-zinc-200">Sent from your real inbox</p>
                            <p className="text-xs text-zinc-500">Not a weird @mail.duely.in address</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                          <div>
                            <p className="text-sm font-medium text-zinc-200">Replies go straight to you</p>
                            <p className="text-xs text-zinc-500">Clients reply directly to your email</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
              <FadeIn delay={0.2} className="order-1 lg:order-2 max-w-xl lg:pl-12 xl:pl-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 mb-6">
                  <Image src="/google-logo.svg" alt="Google" width={24} height={24} className="opacity-80 grayscale invert" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Automated emails that don&apos;t look automated.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Connect your Gmail workspace in one click. Reminders are sent directly from your actual inbox — not a generic &quot;no-reply&quot; system address.
                </p>
              </FadeIn>
            </div>
          </Container>

          {/* 4. Client Portal */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12 xl:pr-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 mb-6">
                  <User className="h-6 w-6 text-emerald-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  They keep asking you to resend the invoice. Then they ask for the payment link.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Give your clients a secure, branded portal where they can view their complete billing history, download past invoices, and pay directly. No more email ping-pong.
                </p>
              </FadeIn>
              <SlideIn right>
                <div className="relative">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-4 shadow-xl shadow-black/20">
                    <CardContent className="p-0">
                        <div className="flex flex-col gap-4 p-4">
                          <div className="flex flex-col gap-1">
                            <p className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider">
                              Client Portal &bull; Your Agency
                            </p>
                            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
                              Acme Corp
                            </h1>
                          </div>
                          
                          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1 shadow-sm">
                            <p className="text-zinc-400 text-xs font-medium">Total Amount Outstanding</p>
                            <p className="text-2xl font-bold tracking-tight text-zinc-50">
                              $4,200.00
                            </p>
                          </div>
                          
                          <div className="flex flex-col gap-3 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                            <h2 className="text-sm font-semibold text-zinc-100">How to Pay</h2>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col gap-1 shadow-sm">
                              <p className="text-sm font-medium text-zinc-100">Chase Business</p>
                              <p className="text-xs text-zinc-500 font-mono">•••• 1234</p>
                            </div>
                          </div>
                        </div>
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
            </div>
          </Container>

          {/* 5. Full-Page Analytics Dashboard */}
          <Container className="max-w-6xl mt-24">
            <div className="flex flex-col items-center text-center mb-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 mb-6">
                <Activity className="h-6 w-6 text-amber-300" />
              </div>
              <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl max-w-3xl">
                Stop guessing how much money is trapped in unpaid invoices.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-zinc-400 max-w-2xl">
                Instantly see your average time-to-pay, aging reports, collection rate, and who your worst offenders are. The analytics dashboard turns your receivables into actionable insights.
              </p>
            </div>

            <FadeIn>
              <Card className="overflow-hidden border-white/10 bg-[#09090b] shadow-2xl shadow-amber-500/5 rounded-2xl relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.03),transparent_60%)] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.03),transparent_60%)] pointer-events-none" />
                
                {/* Mock Browser/Dashboard Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.01]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-zinc-800" />
                    <div className="w-3 h-3 rounded-full bg-zinc-800" />
                    <div className="w-3 h-3 rounded-full bg-zinc-800" />
                  </div>
                  <div className="ml-4 text-xs font-medium text-zinc-600 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-amber-500" />
                    Duely Analytics
                  </div>
                </div>

                <CardContent className="p-4 sm:p-8 bg-zinc-950/40">
                  <div className="flex flex-col gap-6">
                    {/* Top Stats 2 Rows */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Total Collected */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                        <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Total Collected</p>
                        <p className="text-2xl font-bold text-zinc-100">$184,200</p>
                      </div>
                      {/* Outstanding */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                        <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-blue-400" /> Outstanding</p>
                        <p className="text-2xl font-bold text-zinc-100">$42,500</p>
                      </div>
                      {/* Avg Days Overdue */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                        <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-red-400" /> Avg Days Overdue</p>
                        <p className="text-2xl font-bold text-zinc-100">14 <span className="text-sm font-normal text-zinc-500">days</span></p>
                      </div>
                      {/* Collection Rate */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                        <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-amber-400" /> Collection Rate</p>
                        <p className="text-2xl font-bold text-zinc-100">89.2%</p>
                      </div>
                    </div>

                    {/* Charts Row 1: Trends & Pipeline */}
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                        <h4 className="text-sm font-semibold text-zinc-100 mb-1">Collection Trends</h4>
                        <p className="text-xs text-zinc-500 mb-6">Monthly revenue collected over time.</p>
                        <div className="h-40 flex items-end gap-2">
                          {/* Fake Area Chart */}
                          {[20, 35, 30, 50, 45, 70].map((h, i) => (
                            <div key={i} className="flex-1 bg-emerald-500/20 rounded-t relative overflow-hidden" style={{ height: `${h}%` }}>
                              <div className="absolute top-0 w-full h-0.5 bg-emerald-400" />
                              <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-emerald-500/10 to-emerald-500/40" />
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500 mt-2 font-mono">
                          <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                        </div>
                      </div>

                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 flex flex-col items-center justify-center hover:border-white/10 transition-colors">
                        <div className="w-full">
                          <h4 className="text-sm font-semibold text-zinc-100 mb-1">This Month's Pipeline</h4>
                          <p className="text-xs text-zinc-500 mb-6">Status of customers added.</p>
                        </div>
                        {/* Fake Pie Chart */}
                        <div className="relative w-32 h-32 rounded-full border-[12px] border-zinc-800">
                          <div className="absolute inset-[-12px] rounded-full border-[12px] border-emerald-500" style={{ clipPath: "polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 50%)" }} />
                          <div className="absolute inset-[-12px] rounded-full border-[12px] border-blue-500" style={{ clipPath: "polygon(50% 50%, 0 50%, 0 0, 60% 0)" }} />
                          <div className="absolute inset-[-12px] rounded-full border-[12px] border-red-500" style={{ clipPath: "polygon(50% 50%, 60% 0, 100% 0)" }} />
                        </div>
                        <div className="flex gap-4 mt-6">
                          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] text-zinc-400">Paid</span></div>
                          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[10px] text-zinc-400">Wait</span></div>
                          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[10px] text-zinc-400">Late</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Charts Row 2: A/R Aging, Expected Collections, Top Offenders */}
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Top Offenders */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                        <h4 className="text-sm font-semibold text-zinc-100 mb-1">Top Offenders</h4>
                        <p className="text-xs text-zinc-500 mb-6">Highest overdue balances.</p>
                        <div className="space-y-4">
                          {[
                            { name: "Acme Corp", val: 80, amt: "$12,400" },
                            { name: "Globex", val: 60, amt: "$8,200" },
                            { name: "Initech", val: 40, amt: "$4,100" }
                          ].map((offender, i) => (
                            <div key={i} className="flex flex-col gap-1.5">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-zinc-300">{offender.name}</span>
                                <span className="text-red-400 font-mono">{offender.amt}</span>
                              </div>
                              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${offender.val}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* A/R Aging */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                        <h4 className="text-sm font-semibold text-zinc-100 mb-1">A/R Aging</h4>
                        <p className="text-xs text-zinc-500 mb-6">Overdue by age.</p>
                        <div className="h-28 flex items-end gap-3 mt-4">
                          <div className="flex-1 bg-amber-500/20 rounded-t relative hover:bg-amber-500/40 transition-colors" style={{ height: "40%" }}>
                            <div className="absolute top-0 w-full h-0.5 bg-amber-400" />
                          </div>
                          <div className="flex-1 bg-amber-500/20 rounded-t relative hover:bg-amber-500/40 transition-colors" style={{ height: "70%" }}>
                            <div className="absolute top-0 w-full h-0.5 bg-amber-400" />
                          </div>
                          <div className="flex-1 bg-amber-500/50 rounded-t relative shadow-[0_0_15px_rgba(245,158,11,0.2)]" style={{ height: "100%" }}>
                            <div className="absolute top-0 w-full h-0.5 bg-amber-400" />
                          </div>
                          <div className="flex-1 bg-red-500/50 rounded-t relative hover:bg-red-500/70 transition-colors" style={{ height: "30%" }}>
                            <div className="absolute top-0 w-full h-0.5 bg-red-400" />
                          </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-3">
                          <span>1-30</span><span>31-60</span><span className="text-amber-400">61-90</span><span className="text-red-400">90+</span>
                        </div>
                      </div>

                      {/* Expected Collections */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                        <h4 className="text-sm font-semibold text-zinc-100 mb-1">Expected Collections</h4>
                        <p className="text-xs text-zinc-500 mb-6">Upcoming by due date.</p>
                        <div className="h-28 flex items-end gap-3 mt-4">
                          <div className="flex-1 bg-blue-500/40 rounded-t relative hover:bg-blue-500/60 transition-colors" style={{ height: "100%" }}>
                            <div className="absolute top-0 w-full h-0.5 bg-blue-400" />
                          </div>
                          <div className="flex-1 bg-blue-500/20 rounded-t relative hover:bg-blue-500/40 transition-colors" style={{ height: "45%" }}>
                            <div className="absolute top-0 w-full h-0.5 bg-blue-400" />
                          </div>
                          <div className="flex-1 bg-blue-500/20 rounded-t relative hover:bg-blue-500/40 transition-colors" style={{ height: "20%" }}>
                            <div className="absolute top-0 w-full h-0.5 bg-blue-400" />
                          </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-3">
                          <span>Next 30D</span><span>31-60D</span><span>61-90D</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </Container>
        </section>

        {/* BENTO BOX GRID */}
        <section className="py-24 border-b border-white/5 bg-zinc-950">
          <Container>
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-50">
                Everything you need to get paid faster.
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                The complete toolkit for managing agency cashflow, without the awkward conversations.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Analytics */}
              <div className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 lg:col-span-2 flex flex-col justify-between overflow-hidden relative">
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 mb-4">
                    <Sparkles className="h-5 w-5 text-blue-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100">Analytics Dashboard</h3>
                  <p className="mt-2 text-sm text-zinc-400 max-w-sm">Know exactly how much money is trapped in unpaid invoices, at a glance. See your average time-to-pay, aging reports, and collection rate over time.</p>
                </div>
                <div className="mt-8 rounded-xl border border-white/10 bg-zinc-900/80 p-4 w-full max-w-md shadow-lg shadow-black/40">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-zinc-200 text-sm">Total Outstanding</div>
                    <div className="text-sm font-bold text-zinc-100">$42,500</div>
                  </div>
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full w-[60%]" />
                  </div>
                </div>
              </div>

              {/* Weekly Digest */}
              <div className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between overflow-hidden relative">
                <div className="absolute right-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-pink-500/5 to-transparent pointer-events-none" />
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-pink-500/20 bg-pink-500/10 mb-4">
                    <Mail className="h-5 w-5 text-pink-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100">Weekly Digest Email</h3>
                  <p className="mt-2 text-sm text-zinc-400">Start your week knowing exactly who to chase with a beautifully formatted digest straight to your inbox.</p>
                </div>
                <div className="mt-8 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-emerald-400" />
                    <div className="text-xs text-zinc-400">Collected: $18,400.00</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-red-400" />
                    <div className="text-xs font-medium text-red-300">Action: Acme Corp</div>
                  </div>
                </div>
              </div>
              {/* Late Fees */}
              <div className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 lg:col-span-2 flex flex-col justify-between overflow-hidden relative">
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-red-500/5 to-transparent pointer-events-none" />
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 mb-4">
                    <CreditCard className="h-5 w-5 text-red-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100">Automated Late Fees</h3>
                  <p className="mt-2 text-sm text-zinc-400 max-w-sm">You hate charging late fees. But you hate being treated like a free bank even more. Configure a flat or percentage late fee policy once, and let Duely automatically apply it.</p>
                </div>
                <div className="mt-8 rounded-xl border border-white/10 bg-zinc-900/80 p-4 w-full max-w-md shadow-lg shadow-black/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-zinc-200 text-sm">Default Agency Policy</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 font-medium bg-emerald-400/10 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500">5% monthly fee, applied after 14-day grace period</div>
                </div>
              </div>

              {/* Cooldowns */}
              <div className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between overflow-hidden relative">
                <div className="absolute right-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none" />
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 mb-4">
                    <Activity className="h-5 w-5 text-emerald-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100">Smart Cooldowns</h3>
                  <p className="mt-2 text-sm text-zinc-400">You just called them yesterday. You don't want a robot emailing them today. When you step in, Duely backs off.</p>
                </div>
                <div className="mt-8 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-zinc-600" />
                    <div className="text-xs text-zinc-400">Logged call: "Will pay Monday"</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-emerald-400" />
                    <div className="text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">Automated sequence paused (Cooldown)</div>
                  </div>
                </div>
              </div>

              {/* Client Groups */}
              <div className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between overflow-hidden relative">
                <div className="absolute right-0 top-0 w-full h-1/2 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 mb-4">
                    <User className="h-5 w-5 text-blue-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100">Client Segmentation</h3>
                  <p className="mt-2 text-sm text-zinc-400">You can't treat a 5-year VIP the same as someone who disappeared. Group clients and apply targeted automation rules.</p>
                </div>
                <div className="mt-8 flex items-center justify-between bg-zinc-900/80 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-medium text-blue-300">SC</div>
                    <div className="text-sm font-medium text-zinc-200">Stark Corp</div>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold bg-amber-500/20 text-amber-300 px-2 py-1 rounded flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> VIP
                  </div>
                </div>
              </div>

              {/* Stripe Sync */}
              <div className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between overflow-hidden relative lg:col-span-2">
                <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 mb-4">
                    <Sparkles className="h-5 w-5 text-indigo-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100">Accounting Sync</h3>
                  <p className="mt-2 text-sm text-zinc-400 max-w-sm">Seamlessly connect QuickBooks or Xero to pull in invoices instantly. Zero manual data entry required.</p>
                </div>
                <div className="mt-8 flex gap-3">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-zinc-300">QuickBooks Connected</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-zinc-300">Xero Connected</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href="/features">
                <Button variant="secondary" className="px-6">View all features</Button>
              </Link>
            </div>
          </Container>
        </section>

        {/* CTA SECTION */}
        <section className="relative py-24 sm:py-32 overflow-hidden border-t border-white/5 bg-background">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-0 -ml-[40rem] h-[40rem] w-[80rem] rounded-full bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] mix-blend-overlay" />
          </div>

          <Container>
            <SlideUp>
              <div className="relative z-10 mx-auto max-w-2xl text-center">
                <h2 className="text-pretty text-4xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-5xl">
                  Ready to organize your receivables?
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Stop chasing clients out of your inbox and start collecting payments professionally.
                </p>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-indigo-500/20 w-full sm:w-auto">
                      Start free trial — no card required
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/tools" className="w-full sm:w-auto">
                    <Button variant="secondary" size="lg" className="h-12 px-8 text-base w-full sm:w-auto">
                      Explore free tools
                    </Button>
                  </Link>
                </div>
              </div>
            </SlideUp>
          </Container>
        </section>
      
      </main>
    </div>
  );
}
