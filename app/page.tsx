import type { Metadata } from "next";
import Script from "next/script";
import { redirect } from "next/navigation";

import { AuthErrorRedirect } from "@/components/site/auth-error-redirect";
import { Container } from "@/components/site/container";
import { FadeIn } from "@/components/site/scroll-animation";
import { MacWindow } from "@/components/site/mac-window";
import { InteractiveAppDemo } from "@/components/site/interactive-app-demo";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

import { getEmailLinkErrorMessage } from "@/lib/auth-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Zap } from "lucide-react";
import { websiteSchema } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Collect what you're owed, keep the relationship",
  description: "Track outstanding invoices, payment promises, partial payments, and follow-ups. Collections management built for freelancers and agencies.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Collect what you're owed, keep the relationship",
    description: "Track outstanding invoices, payment promises, partial payments, and follow-ups. Collections management built for freelancers and agencies.",
    url: "https://duely.in/",
    type: "website",
    images: [
      {
        url: "https://duely.in/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Collect what you're owed, keep the relationship",
    description: "Track outstanding invoices, payment promises, partial payments, and follow-ups.",
    images: ["https://duely.in/og-image.png"],
  },
};

export default async function Home({
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Duely",
    url: "https://duely.in",
    logo: "https://duely.in/logo.svg",
    description:
      "collections management tool for freelancers and small agencies. Track outstanding invoices, payment promises, partial payments, and automate follow-ups.",
    sameAs: ["https://x.com/AbhishekU008"],
    contactPoint: {
      "@type": "ContactPoint",
      email: "abhishek@duely.in",
      contactType: "customer support",
    },
  };

  const softwareApplicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Duely",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "29",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1M",
      },
    },
    description:
      "Collections management tool for freelancers and small agencies. Invoice follow-up tracking, payment promise logging, partial payment management.",
  };

  const homeSchemas = [
    organizationJsonLd,
    {
      "@context": "https://schema.org",
      ...websiteSchema,
    },
    softwareApplicationJsonLd,
  ];

  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      {homeSchemas.map((schema, index) => (
        <Script
          key={index}
          id={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}
      <AuthErrorRedirect />
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* INTERACTIVE PRODUCT TOUR ONLY */}
        <section id="how-it-works" className="relative py-24 sm:py-32 bg-zinc-950/50 backdrop-blur-sm">
          <Container className="max-w-6xl">
            <div className="flex flex-col items-center text-center mb-16 mt-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 mb-6">
                <Zap className="h-6 w-6 text-indigo-300" />
              </div>
              <h1 className="text-pretty text-4xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-6xl max-w-4xl">
                See exactly how Duely gets you paid faster.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-zinc-400 max-w-2xl">
                Take a spin through the Action Center, track aging invoices in your Pipeline, and see your true cashflow inside Analytics.
              </p>
            </div>

            <FadeIn>
              <MacWindow icon={<Zap className="w-3 h-3 text-indigo-500" />} title="Duely Interactive Tour" className="h-[750px] p-0 overflow-hidden shadow-2xl shadow-indigo-500/10 border-white/10">
                <InteractiveAppDemo />
              </MacWindow>
            </FadeIn>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
