import { useCases } from "@/lib/seo-data";
import SEOPageTemplate from "@/components/site/seo-page-template";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export function generateStaticParams() {
  return Object.keys(useCases).map((usecase) => ({
    usecase,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ usecase: string }> }): Promise<Metadata> {
  const { usecase } = await params;
  const data = useCases[usecase];
  if (!data) return {};

  return {
    title: data.title,
    description: data.metaDescription,
    alternates: {
      canonical: `https://duely.in/use-case/${usecase}`,
    },
    openGraph: {
      title: data.title,
      description: data.metaDescription,
      url: `https://duely.in/use-case/${usecase}`,
      type: "website",
    },
  };
}

export default async function UseCasePage({ params }: { params: Promise<{ usecase: string }> }) {
  const { usecase } = await params;
  const data = useCases[usecase];

  if (!data) {
    notFound();
  }

  return <SEOPageTemplate data={data} />;
}
