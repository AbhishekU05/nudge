import { competitors } from "@/lib/seo-data";
import SEOPageTemplate from "@/components/site/seo-page-template";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export function generateStaticParams() {
  return Object.keys(competitors).map((competitor) => ({
    competitor,
  }));
}

export function generateMetadata({ params }: { params: { competitor: string } }): Metadata {
  const data = competitors[params.competitor];
  if (!data) return {};

  return {
    title: data.title,
    description: data.metaDescription,
    alternates: {
      canonical: `https://duely.in/alternatives/duely-vs-${params.competitor}`,
    },
    openGraph: {
      title: data.title,
      description: data.metaDescription,
      url: `https://duely.in/alternatives/duely-vs-${params.competitor}`,
      type: "website",
    },
  };
}

export default function CompetitorPage({ params }: { params: { competitor: string } }) {
  const data = competitors[params.competitor];

  if (!data) {
    notFound();
  }

  return <SEOPageTemplate data={data} />;
}
