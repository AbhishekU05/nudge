import type { Metadata } from "next";
import Script from "next/script";
import { redirect } from "next/navigation";

import { AuthErrorRedirect } from "@/components/site/auth-error-redirect";
import { Container } from "@/components/site/container";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

import { getEmailLinkErrorMessage } from "@/lib/auth-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
        <section className="relative flex items-center justify-center py-24 sm:py-32 min-h-[50vh]">
          <Container className="max-w-6xl text-center">
            {/* Blank slate as requested */}
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
