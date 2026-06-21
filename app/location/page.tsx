import SEOIndexTemplate from "@/components/site/seo-index-template";
import { locations } from "@/lib/seo-data";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Duely by Location | Duely",
  description: "Explore how businesses around the world use Duely to get paid faster.",
};

export default function Page() {
  const links = Object.keys(locations).map(key => ({
    href: `/location/${key}`,
    label: locations[key].title,
    description: locations[key].metaDescription
  }));

  return (
    <SEOIndexTemplate 
      title="Duely by Location"
      description="Explore how businesses around the world use Duely to get paid faster."
      links={links}
    />
  );
}
