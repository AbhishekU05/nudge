import type { Metadata } from "next";
import { CollectionsROICalculator } from "./calculator";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Container } from "@/components/site/container";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Collections ROI Calculator for Freelancers and Agencies | Duely",
  description: "Calculate the true cost of manual invoice follow-ups and discover the ROI of automating your accounts receivable process.",
  alternates: {
    canonical: "/tools/collections-roi-calculator",
  },
  openGraph: {
    title: "Collections ROI Calculator for Freelancers and Agencies | Duely",
    description: "Calculate the true cost of manual invoice follow-ups and discover the ROI of automating your accounts receivable process.",
    url: "https://duely.in/tools/collections-roi-calculator",
    type: "website",
  }
};

export default function ToolPage() {
  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <SiteHeader />
      <main className="flex-1 pb-24 pt-16 sm:pb-32 sm:pt-24 lg:pb-40 bg-background">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
              Collections ROI Calculator for Freelancers and Agencies
            </h1>
            <p className="mt-6 text-lg text-zinc-400">
              Time spent chasing payments is time you aren't spending billing clients or growing your agency. Calculate the exact ROI of automating your collections.
            </p>
          </div>
          
          <div className="mx-auto max-w-3xl">
            <CollectionsROICalculator />
            
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
