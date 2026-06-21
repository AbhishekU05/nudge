import { industries } from "@/lib/seo-data";
import SEOPageTemplate from "@/components/site/seo-page-template";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export function generateStaticParams() {
  return Object.keys(industries).map((industry) => ({
    industry,
  }));
}

export function generateMetadata({ params }: { params: { industry: string } }): Metadata {
  const data = industries[params.industry];
  if (!data) return {};

  return {
    title: data.title,
    description: data.metaDescription,
    alternates: {
      canonical: `https://duely.in/for/${params.industry}`,
    },
    openGraph: {
      title: data.title,
      description: data.metaDescription,
      url: `https://duely.in/for/${params.industry}`,
      type: "website",
    },
  };
}

export default function IndustryPage({ params }: { params: { industry: string } }) {
  const data = industries[params.industry];

  if (!data) {
    notFound();
  }

  return <SEOPageTemplate data={data} />;
}
