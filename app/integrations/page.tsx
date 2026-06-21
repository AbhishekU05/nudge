import SEOIndexTemplate from "@/components/site/seo-index-template";
import { integrations } from "@/lib/seo-data";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Duely Integrations | Duely",
  description: "Connect Duely with your favorite accounting and invoicing software.",
};

export default function Page() {
  const links = Object.keys(integrations).map(key => ({
    href: `/integrations/${key}`,
    label: integrations[key].title,
    description: integrations[key].metaDescription
  }));

  return (
    <SEOIndexTemplate 
      title="Duely Integrations"
      description="Connect Duely with your favorite accounting and invoicing software."
      links={links}
    />
  );
}
