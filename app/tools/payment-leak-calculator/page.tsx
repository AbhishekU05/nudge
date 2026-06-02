import type { Metadata } from "next";

import { PaymentLeakCalculator } from "@/app/tools/payment-leak-calculator/payment-leak-calculator";

export const metadata: Metadata = {
  alternates: {
    canonical: "/tools/payment-leak-calculator",
  },
  description:
    "Estimate how much cash your agency has tied up in delayed client payments and get a personalized collections report.",
  openGraph: {
    description:
      "Estimate how much cash your agency has tied up in delayed client payments and get a personalized collections report.",
    title: "Agency Payment Leak Estimator | Duely",
    type: "website",
    url: "https://duely.in/tools/payment-leak-calculator",
  },
  title: "Agency Payment Leak Estimator | Duely",
};

export default function PaymentLeakCalculatorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    applicationCategory: "BusinessApplication",
    description:
      "Estimate how much cash your agency has tied up in delayed client payments and get a personalized collections report.",
    name: "Agency Payment Leak Estimator",
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
    url: "https://duely.in/tools/payment-leak-calculator",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <PaymentLeakCalculator />
    </>
  );
}
