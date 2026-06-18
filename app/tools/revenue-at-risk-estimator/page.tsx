import type { Metadata } from "next";
import { RevenueAtRiskEstimator } from "./calculator";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Container } from "@/components/site/container";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Revenue At Risk Calculator — Late Payment Impact | Duely",
  description: "Calculate how much of your annual revenue is delayed and the hidden costs to your business's working capital.",
  alternates: {
    canonical: "/tools/revenue-at-risk-estimator",
  },
  openGraph: {
    title: "Revenue At Risk Calculator — Late Payment Impact | Duely",
    description: "Calculate how much of your annual revenue is delayed and the hidden costs to your business's working capital.",
    url: "https://duely.in/tools/revenue-at-risk-estimator",
    type: "website",
  }
};

export default function ToolPage() {
  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <SiteHeader />
      <main id="main-content" className="flex-1 pb-24 pt-16 sm:pb-32 sm:pt-24 lg:pb-40 bg-background">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
              Revenue At Risk Calculator — Late Payment Impact
            </h1>
            <p className="mt-6 text-lg text-zinc-400">
              Do you know how much late payments are actually costing your business? Enter your numbers below to see the hidden cost of delayed revenue and restricted working capital.
            </p>
          </div>
          
          <div className="mx-auto max-w-3xl">
            <RevenueAtRiskEstimator />
            
            <div className="mt-12 text-center p-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
              <Link href="/signup" className="inline-flex items-center text-lg font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                Save your results and track outstanding invoices in Duely <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
