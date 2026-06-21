import SEOIndexTemplate from "@/components/site/seo-index-template";
import { industries } from "@/lib/seo-data";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Duely for Your Industry | Duely",
  description: "See how Duely helps specific industries manage their collections workflow.",
};

export default function Page() {
  const links = Object.keys(industries).map(key => ({
    href: `/for/${key}`,
    label: industries[key].title,
    description: industries[key].metaDescription
  }));

  return (
    <SEOIndexTemplate 
      title="Duely for Your Industry"
      description="See how Duely helps specific industries manage their collections workflow."
      links={links}
    />
  );
}
