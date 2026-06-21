import { integrations } from "@/lib/seo-data";
import SEOPageTemplate from "@/components/site/seo-page-template";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export function generateStaticParams() {
  return Object.keys(integrations).map((software) => ({
    software,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ software: string }> }): Promise<Metadata> {
  const { software } = await params;
  const data = integrations[software];
  if (!data) return {};

  return {
    title: data.title,
    description: data.metaDescription,
    alternates: {
      canonical: `https://duely.in/integrations/${software}`,
    },
    openGraph: {
      title: data.title,
      description: data.metaDescription,
      url: `https://duely.in/integrations/${software}`,
      type: "website",
    },
  };
}

export default async function SoftwarePage({ params }: { params: Promise<{ software: string }> }) {
  const { software } = await params;
  const data = integrations[software];

  if (!data) {
    notFound();
  }

  return <SEOPageTemplate data={data} />;
}
