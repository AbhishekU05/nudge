import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import {
  entityDefinitions,
  getEntityBySlug,
} from "@/lib/seo/entities";
import { organizationSchema, SITE_URL } from "@/lib/seo/site";

export async function generateStaticParams() {
  return entityDefinitions.map((entity) => ({ slug: entity.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entity = getEntityBySlug(slug);

  if (!entity) {
    return { title: "Not Found | Duely" };
  }

  return {
    title: entity.title,
    description: entity.metaDescription,
    alternates: {
      canonical: `/learn/${slug}`,
    },
    openGraph: {
      title: entity.title,
      description: entity.metaDescription,
      type: "article",
      url: `${SITE_URL}/learn/${slug}`,
    },
  };
}

export default async function EntityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entity = getEntityBySlug(slug);

  if (!entity) {
    notFound();
  }

  const pageUrl = `${SITE_URL}/learn/${slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      name: entity.h1,
      description: entity.definition,
      url: pageUrl,
      inDefinedTermSet: {
        "@type": "DefinedTermSet",
        name: "Duely Collections Glossary",
        url: `${SITE_URL}/learn/duely`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: entity.title,
          item: pageUrl,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      publisher: organizationSchema,
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      {jsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}

      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-white/5 bg-gradient-to-b from-indigo-950/20 to-transparent">
          <Container className="py-20 sm:py-28">
            <div className="mx-auto max-w-3xl">
              <h1 className="text-pretty text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                {entity.h1}
              </h1>
              <p
                id="entity-definition"
                className="mt-8 text-lg leading-8 text-zinc-300"
              >
                {entity.definition}
              </p>
            </div>
          </Container>
        </section>

        <section className="border-b border-white/5 bg-white/[0.01]">
          <Container className="py-16 sm:py-20">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-xl font-semibold text-zinc-100">
                Key points
              </h2>
              <ul className="mt-6 space-y-3">
                {entity.keyPoints.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 text-base leading-7 text-zinc-400"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        <section>
          <Container className="py-16 sm:py-20">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-xl font-semibold text-zinc-100">
                Related resources
              </h2>
              <ul className="mt-6 space-y-3">
                {entity.relatedLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
