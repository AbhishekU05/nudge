/* eslint-disable */
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import type { SEOPageData } from "@/lib/seo-data";
import { Container } from "@/components/site/container";
import { FadeIn, SlideUp } from "@/components/site/scroll-animation";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, CreditCard, Activity, User } from "lucide-react";

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
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How does Duely send reminders?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Duely sends reminders directly from your own connected Gmail account, ensuring they look personal and don&apos;t end up in the spam folder."
            }
          },
          {
            "@type": "Question",
            "name": "Does Duely integrate with my accounting software?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Duely has native 1-click integrations with QuickBooks Online and Xero to automatically pull in your unpaid invoices."
            }
          },
          {
            "@type": "Question",
            "name": "How much does Duely cost?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Duely is a flat $29/month with no hidden fees, and comes with a 7-day free trial that requires no credit card."
            }
          }
        ]
      }
    ] as any[]
  };

  if (data.category && data.slug) {
    let categoryName = data.category.charAt(0).toUpperCase() + data.category.slice(1);
    let categoryPath = `/${data.category}`;
    
    // Adjust path matching Next.js routes
    if (data.category === 'competitor') { categoryName = 'Alternatives'; categoryPath = '/alternatives'; }
    if (data.category === 'industry') { categoryName = 'Industries'; categoryPath = '/for'; }
    if (data.category === 'integration') { categoryName = 'Integrations'; categoryPath = '/integrations'; }
    if (data.category === 'location') { categoryName = 'Locations'; categoryPath = '/location'; }
    if (data.category === 'use-case') { categoryName = 'Use Cases'; categoryPath = '/use-case'; }

    schemaMarkup["@graph"].push({
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://duely.in"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": categoryName,
          "item": `https://duely.in${categoryPath}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": data.title,
          "item": `https://duely.in/${data.slug}`
        }
      ]
    });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      
            {/* Hero Section */}
      <section className="relative pt-24 pb-20 sm:pt-32 sm:pb-32 lg:pb-40">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(79,70,229,0.15),transparent_60%),radial-gradient(ellipse_at_80%_40%,rgba(168,85,247,0.08),transparent_50%)]" />
        <Container>
          <FadeIn className="max-w-4xl mx-auto text-center">
            <h1 className="text-pretty text-5xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-6xl lg:text-7xl lg:leading-[1.05] mb-6">
              {data.h1}
            </h1>
            <p className="mt-6 text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              {data.subtitle}
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-indigo-500/20 w-full sm:w-auto">
                  {data.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-zinc-500 mt-6">7-day free trial • No credit card required</p>
          </FadeIn>
        </Container>
      </section>

            {/* Pain Point Section */}
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

            {/* Features Section */}
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

          {/* Unique Content Section */}
          {data.longContent && (
            <div className="prose prose-invert prose-emerald max-w-4xl mx-auto">
              {data.longContent.type === 'competitor' && (
                <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 md:p-12">
                  <h2 className="text-3xl font-bold text-zinc-100 mb-8 text-center">Feature Breakdown</h2>
                  <div className="grid md:grid-cols-2 gap-12">
                    <div>
                      <h3 className="text-xl font-bold text-zinc-300 mb-6 flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-sm">✕</span> Their Approach</h3>
                      <ul className="space-y-4">
                        {data.longContent.data.theirWeaknesses.map((w: string, i: number) => (
                          <li key={i} className="text-zinc-400 flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 mt-2 shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-zinc-300 mb-6 flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-sm">✓</span> Duely's Approach</h3>
                      <ul className="space-y-4">
                        {data.longContent.data.ourStrengths.map((s: string, i: number) => (
                          <li key={i} className="text-zinc-400 flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-12 pt-8 border-t border-white/5 text-center">
                    <p className="text-lg text-zinc-300 italic">{data.longContent.data.conclusion}</p>
                  </div>
                </div>
              )}

              {data.longContent.type === 'industry' && (
                <div className="space-y-12">
                  <h2 className="text-3xl font-bold text-center mb-8">Specific Challenges in this Industry</h2>
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                      <h3 className="text-emerald-500 font-bold mb-4 border-b border-white/5 pb-4">01. Scope Creep</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">{data.longContent.data.challenge1}</p>
                    </div>
                    <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                      <h3 className="text-emerald-500 font-bold mb-4 border-b border-white/5 pb-4">02. Relationship Friction</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">{data.longContent.data.challenge2}</p>
                    </div>
                    <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                      <h3 className="text-emerald-500 font-bold mb-4 border-b border-white/5 pb-4">03. Disorganized Tracking</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">{data.longContent.data.challenge3}</p>
                    </div>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-8 text-center mt-8">
                    <h3 className="text-xl font-bold text-zinc-100 mb-4">The Solution</h3>
                    <p className="text-zinc-300">{data.longContent.data.solution}</p>
                  </div>
                </div>
              )}

              {data.longContent.type === 'integration' && (
                <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 md:p-12">
                  <h2 className="text-3xl font-bold text-center mb-10">How It Works: Step by Step</h2>
                  <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-zinc-900 text-emerald-500 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">1</div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                        <p className="text-zinc-400">{data.longContent.data.step1}</p>
                      </div>
                    </div>
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-zinc-900 text-emerald-500 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">2</div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                        <p className="text-zinc-400">{data.longContent.data.step2}</p>
                      </div>
                    </div>
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-zinc-900 text-emerald-500 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">3</div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                        <p className="text-zinc-400">{data.longContent.data.step3}</p>
                      </div>
                    </div>
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-zinc-900 text-emerald-500 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">4</div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                        <p className="text-zinc-400">{data.longContent.data.step4}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-12 text-center text-zinc-300 font-medium bg-emerald-500/10 p-6 rounded-xl border border-emerald-500/20">
                    {data.longContent.data.benefit}
                  </div>
                </div>
              )}

              {data.longContent.type === 'location' && (
                <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 md:p-12">
                  <h2 className="text-3xl font-bold text-zinc-100 mb-8 text-center">Local Business Context</h2>
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-bold text-emerald-500 mb-3">Business Culture</h3>
                      <p className="text-zinc-400 leading-relaxed text-lg">{data.longContent.data.culture}</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-emerald-500 mb-3">Late Fees vs Automation</h3>
                      <p className="text-zinc-400 leading-relaxed text-lg">{data.longContent.data.legal}</p>
                    </div>
                    <div className="border-t border-white/10 pt-8 mt-8">
                      <h3 className="text-xl font-bold text-zinc-100 mb-3">The Automated Approach</h3>
                      <p className="text-zinc-300 leading-relaxed text-lg">{data.longContent.data.solution}</p>
                    </div>
                  </div>
                </div>
              )}

              {data.longContent.type === 'use-case' && (
                <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 md:p-12">
                  <h2 className="text-3xl font-bold text-zinc-100 mb-10 text-center">Real-World Scenario</h2>
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
                      <div className="text-red-400 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> The Problem</div>
                      <p className="text-zinc-400 leading-relaxed">{data.longContent.data.problem}</p>
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6">
                      <div className="text-blue-400 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> The Workflow</div>
                      <p className="text-zinc-400 leading-relaxed">{data.longContent.data.solution}</p>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-16 -mt-16" />
                      <div className="text-emerald-400 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> The Result</div>
                      <p className="text-zinc-300 leading-relaxed font-medium relative z-10">{data.longContent.data.result}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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

        
            {/* Bottom CTA */}
      <section className="relative py-24 sm:py-32 overflow-hidden border-t border-white/5 bg-background">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -ml-[40rem] h-[40rem] w-[80rem] rounded-full bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] mix-blend-overlay" />
        </div>

        <Container>
          <SlideUp>
            <div className="relative z-10 mx-auto max-w-2xl text-center">
              <h2 className="text-pretty text-4xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-5xl">
                Ready to fix your cash flow?
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                Join hundreds of agencies and freelancers using Duely to automate their accounts receivable.
              </p>

              <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-indigo-500/20 w-full sm:w-auto">
                    Start Your 7-day free trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-zinc-500 mt-6">Just $29/month after trial • Cancel anytime</p>
            </div>
          </SlideUp>
        </Container>
      </section>

      {/* Internal SEO Linking */}
      {data.relatedLinks && data.relatedLinks.length > 0 && (
        <section className="py-12 bg-zinc-950 border-t border-white/5 px-6">
          <div className="max-w-4xl mx-auto">
            <h4 className="font-bold text-zinc-300 mb-6 text-center">Related Pages</h4>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {data.relatedLinks.map((link, i) => (
                <Link key={i} href={link.href} className="bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-emerald-400 border border-white/5 px-4 py-2 rounded-full transition-all">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
