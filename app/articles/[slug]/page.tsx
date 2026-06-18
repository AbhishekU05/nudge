import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";

import { Container } from "@/components/site/container";
import { HeroEmailCapture } from "@/components/site/hero-email-capture";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Badge } from "@/components/ui/badge";
import {
  extractFaqItems,
  extractQuickAnswer,
  splitArticleContent,
} from "@/lib/seo/article-content";
import { SITE_URL } from "@/lib/seo/site";

export async function generateStaticParams() {
  const articlesDir = path.join(process.cwd(), "public", "articles");
  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".md"));

  return files.map((file) => ({
    slug: file.replace(".md", ""),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), "public", "articles", `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return {
      title: "Article Not Found | Duely",
    };
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data } = matter(fileContent);
  const title = data.title || "Article";

  return {
    title,
    description: data.description || "",
    alternates: {
      canonical: `/articles/${slug}`,
    },
    openGraph: {
      title,
      description: data.description || "",
      type: "article",
      url: `${SITE_URL}/articles/${slug}`,
    },
  };
}

function buildArticleSchemas({
  title,
  description,
  slug,
  quickAnswer,
  faqItems,
}: {
  title: string;
  description: string;
  slug: string;
  quickAnswer: string | null;
  faqItems: ReturnType<typeof extractFaqItems>;
}) {
  const pageUrl = `${SITE_URL}/articles/${slug}`;
  const duelyOrganization = {
    "@type": "Organization",
    name: "Duely",
    url: SITE_URL,
  };

  const schemas: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      author: duelyOrganization,
      publisher: {
        ...duelyOrganization,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/logo.svg`,
        },
      },
      datePublished: "2025-01-01",
      dateModified: "2026-06-18",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": pageUrl,
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
          name: "Articles",
          item: `${SITE_URL}/articles`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: title,
          item: pageUrl,
        },
      ],
    },
  ];

  if (quickAnswer) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebPage",
      url: pageUrl,
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["#quick-answer"],
      },
    });
  }

  if (faqItems.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return schemas;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const filePath = path.join(process.cwd(), "public", "articles", `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return (
      <div className="flex flex-1 items-center justify-center p-20">
        <h1 className="text-2xl font-semibold">Article not found</h1>
      </div>
    );
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContent);

  const title = data.title || "Article";
  const description = data.description || "";
  const audience = data.audience || "Guides";

  const quickAnswer = extractQuickAnswer(content);
  const faqItems = extractFaqItems(content);
  const { body } = splitArticleContent(content);

  const jsonLd = buildArticleSchemas({
    title,
    description,
    slug,
    quickAnswer,
    faqItems,
  });

  return (
    <div className="flex flex-1 flex-col">
      {jsonLd.map((schema, index) => (
        <Script
          key={index}
          id={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}

      <SiteHeader />

      <main id="main-content" className="flex-1">
        <section className="border-b border-white/5 bg-gradient-to-b from-indigo-950/20 to-transparent">
          <Container className="py-20 sm:py-28 text-center">
            <nav className="mb-8 text-sm text-zinc-500 font-medium mx-auto max-w-4xl flex items-center justify-center space-x-2">
              <Link href="/" className="hover:text-zinc-300 transition-colors">Home</Link>
              <span>&gt;</span>
              <Link href="/articles" className="hover:text-zinc-300 transition-colors">Articles</Link>
              <span>&gt;</span>
              <span className="text-zinc-300">{title}</span>
            </nav>
            <Badge
              variant="default"
              className="mb-6 bg-white/[0.03] text-zinc-400 border-white/10"
            >
              {audience}
            </Badge>
            <h1 className="mx-auto max-w-4xl text-pretty text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-400">
                {description}
              </p>
            )}
          </Container>
        </section>

        {quickAnswer && (
          <section className="border-b border-white/5 bg-indigo-950/10">
            <Container className="py-10 sm:py-12">
              <div className="mx-auto max-w-3xl">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-indigo-300">
                  Quick Answer
                </h2>
                <p
                  id="quick-answer"
                  className="mt-4 text-base leading-8 text-zinc-200"
                >
                  {quickAnswer}
                </p>
              </div>
            </Container>
          </section>
        )}

        <section className="border-b border-white/5 bg-white/[0.01]">
          <Container className="py-20 sm:py-28">
            <div className="mx-auto max-w-3xl prose prose-invert prose-indigo prose-img:rounded-xl prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto w-full mb-8">
                      <table className="w-full text-left border-collapse" {...props} />
                    </div>
                  )
                }}
              >
                {body}
              </ReactMarkdown>
            </div>
          </Container>
        </section>

        <section>
          <Container className="py-20 sm:py-28">
            <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-gradient-to-b from-indigo-950/30 to-transparent px-8 py-16 text-center sm:px-14 sm:py-20">
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Ready to organize your receivables?
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-zinc-400">
                Stop chasing clients out of your inbox. Bring operational clarity
                to your post-invoice workflow and start collecting payments
                professionally.
              </p>
              <div className="mt-10 flex justify-center">
                <HeroEmailCapture className="w-full max-w-md" />
              </div>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
