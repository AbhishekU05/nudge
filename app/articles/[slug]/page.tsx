import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";

import { Container } from "@/components/site/container";
import { HeroEmailCapture } from "@/components/site/hero-email-capture";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  return {
    title: `${data.title || "Article"} | Duely`,
    description: data.description || "",
    openGraph: {
      title: `${data.title || "Article"} | Duely`,
      description: data.description || "",
      type: "article",
    },
  };
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
  const datePublished = data.date || new Date().toISOString().split("T")[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    author: {
      "@type": "Organization",
      name: "Duely",
      url: "https://duely.in",
    },
    datePublished: datePublished,
    url: `https://duely.in/articles/${slug}`,
  };

  return (
    <div className="flex flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              width={32}
              height={32}
              alt="Duely Logo"
              className="h-8 w-8 rounded-md"
            />
            <span className="text-2xl font-semibold tracking-tight text-zinc-50">
              Duely
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </Container>
      </header>

      <main className="flex-1">
        {/* ── 1. Hero ── */}
        <section className="border-b border-white/5 bg-gradient-to-b from-indigo-950/20 to-transparent">
          <Container className="py-20 sm:py-28 text-center">
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

        {/* ── 2. Markdown Content ── */}
        <section className="border-b border-white/5 bg-white/[0.01]">
          <Container className="py-20 sm:py-28">
            <div className="mx-auto max-w-3xl prose prose-invert prose-indigo prose-img:rounded-xl prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </Container>
        </section>

        {/* ── 3. Final CTA ── */}
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

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-border">
        <Container className="flex flex-col items-center justify-between gap-4 py-8 text-sm text-zinc-600 sm:flex-row">
          <div>© {new Date().getFullYear()} Duely. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">
              Terms
            </Link>
            <span>·</span>
            <Link
              href="/privacy"
              className="hover:text-zinc-300 transition-colors"
            >
              Privacy
            </Link>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <span>Contact us:</span>
              <a
                href="mailto:support@duely.in"
                className="font-medium text-zinc-400 transition-colors hover:text-zinc-100"
              >
                support@duely.in
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
