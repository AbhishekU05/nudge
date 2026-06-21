import SEOIndexTemplate from "@/components/site/seo-index-template";
import { useCases } from "@/lib/seo-data";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Duely Use Cases | Duely",
  description: "Discover the different ways you can use Duely to optimize your cash flow.",
};

export default function Page() {
  const links = Object.keys(useCases).map(key => ({
    href: `/use-case/${key}`,
    label: useCases[key].title,
    description: useCases[key].metaDescription
  }));

  return (
    <SEOIndexTemplate 
      title="Duely Use Cases"
      description="Discover the different ways you can use Duely to optimize your cash flow."
      links={links}
    />
  );
}
