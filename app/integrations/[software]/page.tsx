import { integrations } from "@/lib/seo-data";
import SEOPageTemplate from "@/components/site/seo-page-template";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export function generateStaticParams() {
  return Object.keys(integrations).map((software) => ({
    software,
  }));
}

export function generateMetadata({ params }: { params: { software: string } }): Metadata {
  const data = integrations[params.software];
  if (!data) return {};

  return {
    title: data.title,
    description: data.metaDescription,
    alternates: {
      canonical: `https://duely.in/integrations/${params.software}`,
    },
    openGraph: {
      title: data.title,
      description: data.metaDescription,
      url: `https://duely.in/integrations/${params.software}`,
      type: "website",
    },
  };
}

export default function IntegrationPage({ params }: { params: { software: string } }) {
  const data = integrations[params.software];

  if (!data) {
    notFound();
  }

  return <SEOPageTemplate data={data} />;
}
