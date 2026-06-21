/* eslint-disable */
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import type { SEOPageData } from "@/lib/seo-data";

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
              "text": "Duely is a flat $29/month with no hidden fees, and comes with a 14-day free trial that requires no credit card."
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
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-100 mb-6 leading-tight">
            {data.h1}
          </h1>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {data.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/signup" 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full font-medium transition-all text-lg w-full sm:w-auto"
            >
              {data.cta}
            </Link>
            <p className="text-sm text-zinc-500 sm:hidden">14-day free trial • No credit card required</p>
          </div>
          <p className="hidden sm:block text-sm text-zinc-500 mt-4">14-day free trial • No credit card required</p>
        </div>
      </section>

      {/* Pain Point Section */}
      <section className="py-20 bg-white/[0.02] border-y border-white/5 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-50" />
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-6">The Real Problem</h2>
            <p className="text-lg text-zinc-400 leading-relaxed">
              {data.painPoint}
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-100 mb-4">Why Duely is Built for You</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              We focus on one thing: getting your overdue invoices paid without ruining your client relationships.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {data.features.map((feature, index) => (
              <div key={index} className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.04] transition-colors">
                <div className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-zinc-300 font-medium leading-relaxed">{feature}</p>
              </div>
            ))}
          </div>

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
      </section>

      {/* Differentiators Section */}
      <section className="py-20 bg-zinc-950 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-zinc-100 mb-10 text-center">The Duely Difference</h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-zinc-100 mb-1">Sent from your Gmail</h3>
                <p className="text-zinc-400 text-sm">Not a generic no-reply address.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-zinc-100 mb-1">QuickBooks & Xero Sync</h3>
                <p className="text-zinc-400 text-sm">Always in perfect harmony.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-zinc-100 mb-1">Track Payment Promises</h3>
                <p className="text-zinc-400 text-sm">Know exactly when cash is landing.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-zinc-100 mb-1">Owner-Led Focus</h3>
                <p className="text-zinc-400 text-sm">Built for founders, not finance teams.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-500/5" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-zinc-100 mb-6">Ready to fix your cash flow?</h2>
          <p className="text-xl text-zinc-400 mb-10">
            Join hundreds of agencies and freelancers using Duely to automate their accounts receivable.
          </p>
          <Link 
            href="/signup" 
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full font-medium transition-all text-lg"
          >
            Start Your 14-Day Free Trial <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="text-sm text-zinc-500 mt-6">Just $29/month after trial • Cancel anytime</p>
        </div>
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
