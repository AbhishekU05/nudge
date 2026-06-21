import { competitors } from "@/lib/seo-data";
import SEOPageTemplate from "@/components/site/seo-page-template";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export function generateStaticParams() {
  return Object.keys(competitors).map((competitor) => ({
    competitor: `duely-vs-${competitor}`,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ competitor: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const competitorId = resolvedParams.competitor.replace('duely-vs-', '');
  const data = competitors[competitorId];
  if (!data) return {};

  return {
    title: data.title,
    description: data.metaDescription,
    alternates: {
      canonical: `https://duely.in/alternatives/${resolvedParams.competitor}`,
    },
    openGraph: {
      title: data.title,
      description: data.metaDescription,
      url: `https://duely.in/alternatives/${resolvedParams.competitor}`,
      type: "website",
    },
  };
}

export default async function CompetitorPage({ params }: { params: Promise<{ competitor: string }> }) {
  const resolvedParams = await params;
  const competitorId = resolvedParams.competitor.replace('duely-vs-', '');
  const data = competitors[competitorId];

  if (!data) {
    notFound();
  }

  return <SEOPageTemplate data={data} />;
}
