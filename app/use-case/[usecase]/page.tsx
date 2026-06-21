import { useCases } from "@/lib/seo-data";
import SEOPageTemplate from "@/components/site/seo-page-template";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export function generateStaticParams() {
  return Object.keys(useCases).map((usecase) => ({
    usecase,
  }));
}

export function generateMetadata({ params }: { params: { usecase: string } }): Metadata {
  const data = useCases[params.usecase];
  if (!data) return {};

  return {
    title: data.title,
    description: data.metaDescription,
    alternates: {
      canonical: `https://duely.in/use-case/${params.usecase}`,
    },
    openGraph: {
      title: data.title,
      description: data.metaDescription,
      url: `https://duely.in/use-case/${params.usecase}`,
      type: "website",
    },
  };
}

export default function UseCasePage({ params }: { params: { usecase: string } }) {
  const data = useCases[params.usecase];

  if (!data) {
    notFound();
  }

  return <SEOPageTemplate data={data} />;
}
