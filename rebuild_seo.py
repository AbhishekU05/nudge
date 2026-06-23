import re

with open("app/page.tsx", "r") as f:
    page_text = f.read()

# We want to convert app/page.tsx into components/site/seo-page-template.tsx

# 1. Imports
imports = """import Link from "next/link";
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
"""

# Extract everything between <main id="main-content" className="flex-1"> and </main> in app/page.tsx
pattern_main = re.compile(r"(<main id=\"main-content\" className=\"flex-1\">)(.*?)(</main>)", re.DOTALL)
match_main = pattern_main.search(page_text)
main_content = match_main.group(2) if match_main else ""

# Remove Pricing, Lifetime Deal, Founder Note, From the Blog, FAQ
main_content = re.sub(r"\{/\* PRICING SECTION \*/\}.*?(?=\{/\* CTA SECTION \*/\})", "", main_content, flags=re.DOTALL)
main_content = re.sub(r"\{/\* LIFETIME DEAL \*/\}.*?(?=\{/\* FOUNDER NOTE \*/\})", "", main_content, flags=re.DOTALL)
main_content = re.sub(r"\{/\* FOUNDER NOTE \*/\}.*?(?=\{/\* FROM THE BLOG \*/\})", "", main_content, flags=re.DOTALL)
main_content = re.sub(r"\{/\* FROM THE BLOG \*/\}.*?(?=\{/\* FAQ SECTION \*/\})", "", main_content, flags=re.DOTALL)
main_content = re.sub(r"\{/\* FAQ SECTION \*/\}.*?(?=\{/\* CTA SECTION \*/\})", "", main_content, flags=re.DOTALL)


# Replace Hero text with data.h1, data.subtitle, and data.cta
main_content = re.sub(
    r"<h1.*?>.*?</h1>", 
    '<h1 className="mt-8 text-pretty text-5xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-6xl lg:text-7xl lg:leading-[1.05]">{data.h1}</h1>', 
    main_content, count=1, flags=re.DOTALL)

main_content = re.sub(
    r"<p className=\"mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400\">.*?</p>", 
    '<p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400">{data.subtitle}</p>', 
    main_content, count=1, flags=re.DOTALL)

main_content = re.sub(
    r"<p className=\"mt-4 max-w-xl text-pretty text-base font-medium text-zinc-300\">.*?</p>", 
    '<p className="mt-4 max-w-xl text-pretty text-base font-medium text-zinc-300">Start your 7-day free trial. No credit card required.</p>', 
    main_content, count=1, flags=re.DOTALL)

main_content = re.sub(
    r"Start free trial — no card required", 
    '{data.cta}', 
    main_content, count=1)

# Inject Pain Point and Features right after Hero (before Stats)
seo_blocks = """
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
"""

main_content = main_content.replace("{/* STATS SECTION */}", seo_blocks + "\n        {/* STATS SECTION */}")


# Construct the final file
final_code = imports + """
  return (
    <div className="flex flex-col min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }} />
      <main className="flex-1">
""" + main_content + """
      </main>
    </div>
  );
}
"""

with open("components/site/seo-page-template.tsx", "w") as f:
    f.write(final_code)

print("seo-page-template.tsx successfully rewritten!")
