import { locations } from "@/lib/seo-data";
import SEOPageTemplate from "@/components/site/seo-page-template";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export function generateStaticParams() {
  return Object.keys(locations).map((location) => ({
    location,
  }));
}

export function generateMetadata({ params }: { params: { location: string } }): Metadata {
  const data = locations[params.location];
  if (!data) return {};

  return {
    title: data.title,
    description: data.metaDescription,
    alternates: {
      canonical: `https://duely.in/location/${params.location}`,
    },
    openGraph: {
      title: data.title,
      description: data.metaDescription,
      url: `https://duely.in/location/${params.location}`,
      type: "website",
    },
  };
}

export default function LocationPage({ params }: { params: { location: string } }) {
  const data = locations[params.location];

  if (!data) {
    notFound();
  }

  return <SEOPageTemplate data={data} />;
}
