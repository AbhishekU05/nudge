import SEOIndexTemplate from "@/components/site/seo-index-template";
import { competitors } from "@/lib/seo-data";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Duely Alternatives & Comparisons | Duely",
  description: "Compare Duely with other invoice tracking and accounts receivable tools.",
};

export default function Page() {
  const links = Object.keys(competitors).map(key => ({
    href: `/alternatives/duely-vs-${key}`,
    label: competitors[key].title,
    description: competitors[key].metaDescription
  }));

  return (
    <SEOIndexTemplate 
      title="Duely Alternatives & Comparisons"
      description="Compare Duely with other invoice tracking and accounts receivable tools."
      links={links}
    />
  );
}
