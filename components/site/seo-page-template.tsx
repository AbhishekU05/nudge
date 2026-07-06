import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { SEOPageData } from "@/lib/seo-data";
import { Container } from "@/components/site/container";
import { FadeIn } from "@/components/site/scroll-animation";
import { LandingPageBody } from "@/components/site/landing-page-body";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { AuthErrorRedirect } from "@/components/site/auth-error-redirect";

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
    ] as Record<string, unknown>[]
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
      <AuthErrorRedirect />
      <SiteHeader />
      <main id="main-content" className="flex-1">

        {/* HERO SECTION */}
        <section className="py-28 sm:py-36">
          <Container className="max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              {data.h1}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-400 max-w-lg mx-auto">
              {data.subtitle}
            </p>
            <div className="mt-10 flex items-center justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-lg bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
              >
                {data.cta}
              </Link>
            </div>
          </Container>
        </section>

        
        {data.painPoint && data.category !== 'industry' && (
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

        {data.features && data.features.length > 0 && data.category !== 'industry' && (
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

        <LandingPageBody />

      </main>

      <SiteFooter />
    </div>
  );
}
