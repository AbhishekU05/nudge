import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { Container } from "@/components/site/container";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

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
      <SiteHeader />

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
            <div className="mb-16">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-50 mb-8">
                Start here: Most read articles
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {articles
                  .filter((a) => [
                    "how-to-write-a-demand-letter-as-a-consultant",
                    "how-to-track-payment-promises-from-clients",
                    "what-to-say-when-a-client-misses-a-payment-deadline",
                    "tools-for-tracking-outstanding-invoices"
                  ].includes(a.slug))
                  .map((article) => (
                    <Link key={article.slug} href={`/articles/${article.slug}`}>
                      <div className="group flex h-full flex-col justify-between rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] p-6 transition-colors hover:bg-indigo-500/[0.05]">
                        <div>
                          <h3 className="mb-2 font-semibold text-zinc-100 transition-colors group-hover:text-indigo-300">
                            {article.title}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>

            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-50 mb-8">
              All articles
            </h2>
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

      <SiteFooter />
    </div>
  );
}
