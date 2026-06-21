import { locations } from "@/lib/seo-data";
import SEOPageTemplate from "@/components/site/seo-page-template";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export function generateStaticParams() {
  return Object.keys(locations).map((location) => ({
    location,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ location: string }> }): Promise<Metadata> {
  const { location } = await params;
  const data = locations[location];
  if (!data) return {};

  return {
    title: data.title,
    description: data.metaDescription,
    alternates: {
      canonical: `https://duely.in/location/${location}`,
    },
    openGraph: {
      title: data.title,
      description: data.metaDescription,
      url: `https://duely.in/location/${location}`,
      type: "website",
    },
  };
}

export default async function LocationPage({ params }: { params: Promise<{ location: string }> }) {
  const { location } = await params;
  const data = locations[location];

  if (!data) {
    notFound();
  }

  return <SEOPageTemplate data={data} />;
}
