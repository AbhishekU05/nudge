import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";

import { AuthErrorRedirect } from "@/components/site/auth-error-redirect";
import { Container } from "@/components/site/container";
import { FadeIn, Reveal } from "@/components/site/scroll-animation";
import { HeroActionCenter } from "@/components/site/hero-action-center";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { LandingPageBody } from "@/components/site/landing-page-body";
import { getRemainingLifetimeSpots } from "@/app/actions/leads";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getEmailLinkErrorMessage } from "@/lib/auth-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { websiteSchema } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Invoice Follow-Up Software for Consultants | Duely",
  description:
    "Protect your consulting relationships by automating your invoice follow-ups and tracking payment promises effortlessly.",
  alternates: { canonical: "/for-consultants" },
};

export default async function ForConsultantsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    error_code?: string;
    error_description?: string;
  }>;
}) {
  const { error, error_description: errorDescription } = await searchParams;

  if (error || errorDescription) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(
        getEmailLinkErrorMessage(errorDescription ?? error),
      )}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const spotsLeft = await getRemainingLifetimeSpots();

  if (user) redirect("/dashboard");

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Duely",
      url: "https://duely.in",
      logo: "https://duely.in/logo.svg",
      description: "collections management tool for freelancers and small agencies.",
      sameAs: ["https://x.com/AbhishekU008"],
      contactPoint: { "@type": "ContactPoint", email: "abhishek@duely.in", contactType: "customer support" },
    },
    { "@context": "https://schema.org", ...websiteSchema },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Duely",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "29", priceCurrency: "USD", priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" } },
      description: "Collections management tool for freelancers and small agencies.",
    },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      {schemas.map((schema, index) => (
        <Script
          key={index}
          id={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
        />
      ))}
      <AuthErrorRedirect />
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* ── Hero (consultants-specific) ── */}
        <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-32 lg:pb-40">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(79,70,229,0.15),transparent_60%),radial-gradient(ellipse_at_80%_40%,rgba(168,85,247,0.08),transparent_50%)]" />
          <Container>
            <div className="grid gap-16 lg:grid-cols-[0.9fr_1.2fr] lg:items-center">
              <FadeIn className="max-w-2xl">
                <h1 className="mt-8 text-pretty text-5xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-6xl lg:text-[4.5rem] lg:leading-[1.05]">
                  You provide high-level consulting. Stop doing low-level debt collection.
                </h1>
                <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400">
                  Protect your consulting relationships by automating your invoice
                  follow-ups and tracking payment promises effortlessly.
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
              </FadeIn>
              <Reveal delay={0.2} className="relative z-10 lg:ml-auto w-full max-w-[640px] lg:max-w-none">
                <HeroActionCenter />
              </Reveal>
            </div>
          </Container>
        </section>

        {/* ── All shared sections ── */}
        <LandingPageBody spotsLeft={spotsLeft} />
      </main>

      <SiteFooter />
    </div>
  );
}
