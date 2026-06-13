import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Articles & Guides",
  description: "Learn how to manage accounts receivable, collect payments professionally, and follow up on overdue invoices without burning relationships.",
  alternates: { canonical: "/articles" },
};

export default function ArticlesPage() {
  const articlesDir = path.join(process.cwd(), "public", "articles");
  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".md"));

  const articles = files.map((file) => {
    const filePath = path.join(articlesDir, file);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContent);

    return {
      slug: file.replace(".md", ""),
      title: data.title || "Untitled Article",
      description: data.description || "",
      audience: data.audience || "Guides",
    };
  });

  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <Image
              src="/logo.svg"
              width={32}
              height={32}
              alt="Duely Logo"
              className="h-8 w-8 rounded-md shadow-sm"
            />
            <span className="text-xl font-semibold tracking-tight text-zinc-50">Duely</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/about"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100 sm:inline-flex"
            >
              About
            </Link>
            <Link
              href="/articles"
              className="hidden rounded-lg bg-white/[0.04] px-3 py-2 text-sm font-medium text-zinc-100 transition-colors sm:inline-flex"
            >
              Articles
            </Link>
            <Link
              href="/faq"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100 sm:inline-flex"
            >
              FAQ
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-zinc-50">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="shadow-lg shadow-indigo-500/20">Get started</Button>
            </Link>
          </div>
        </Container>
      </header>

      <main className="flex-1">
        <section className="border-b border-white/5 bg-gradient-to-b from-indigo-950/20 to-transparent">
          <Container className="py-20 sm:py-28 text-center">
            <h1 className="mx-auto max-w-4xl text-pretty text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl lg:text-6xl">
              Articles & Guides
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-400">
              Expert advice on accounts receivable, professional follow-ups, and getting paid on time without burning client relationships.
            </p>
          </Container>
        </section>

        <section className="py-16 sm:py-24">
          <Container>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Link key={article.slug} href={`/articles/${article.slug}`}>
                  <div className="group flex h-full flex-col justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-7 transition-colors hover:border-indigo-500/30 hover:bg-white/[0.04]">
                    <div>
                      <h3 className="mb-3 font-semibold text-zinc-100 transition-colors group-hover:text-indigo-300">
                        {article.title}
                      </h3>
                      <p className="line-clamp-3 text-sm leading-6 text-zinc-400">
                        {article.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      </main>

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
