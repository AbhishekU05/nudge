import { industries } from "@/lib/seo-data";
import SEOPageTemplate from "@/components/site/seo-page-template";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export function generateStaticParams() {
  return Object.keys(industries).map((industry) => ({
    industry,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ industry: string }> }): Promise<Metadata> {
  const { industry } = await params;
  const data = industries[industry];
  if (!data) return {};

  return {
    title: data.title,
    description: data.metaDescription,
    alternates: {
      canonical: `https://duely.in/for/${industry}`,
    },
    openGraph: {
      title: data.title,
      description: data.metaDescription,
      url: `https://duely.in/for/${industry}`,
      type: "website",
    },
  };
}

export default async function IndustryPage({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  const data = industries[industry];

  if (!data) {
    notFound();
  }

  return <SEOPageTemplate data={data} />;
}
