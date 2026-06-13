import type { Metadata } from "next";

import { CollectionsMaturityAssessment } from "@/app/tools/collections-maturity-assessment/collections-maturity-assessment";

export const metadata: Metadata = {
  alternates: {
    canonical: "/tools/collections-maturity-assessment",
  },
  description:
    "Evaluate the maturity of your agency's collections process. Get a personalized maturity score, category breakdown, and improvement roadmap.",
  openGraph: {
    description:
      "Evaluate the maturity of your agency's collections process and identify operational weaknesses.",
    title: "Collections Maturity Assessment",
    type: "website",
    url: "https://duely.in/tools/collections-maturity-assessment",
  },
  title: "Collections Maturity Assessment",
};

export default function CollectionsMaturityAssessmentPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    applicationCategory: "BusinessApplication",
    description:
      "Evaluate the maturity of your agency's collections process and identify operational weaknesses.",
    name: "Collections Maturity Assessment",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    operatingSystem: "Any",
    provider: {
      "@type": "Organization",
      name: "Duely",
      url: "https://duely.in",
    },
    url: "https://duely.in/tools/collections-maturity-assessment",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <CollectionsMaturityAssessment />
    </>
  );
}
