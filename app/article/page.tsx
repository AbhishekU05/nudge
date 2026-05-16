import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ArticleTemplatePage() {
  return (
    <div className="flex flex-1 flex-col">
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
            <span className="text-2xl font-semibold tracking-tight text-zinc-50">Duely</span>
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
        <Container className="max-w-3xl py-16 sm:py-24">
          {/* Article Header */}
          <div className="mb-12">
            <Badge variant="default" className="mb-6 bg-white/[0.03] text-zinc-400 border-white/10">
              Design Template
            </Badge>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl mb-6">
              Lorem Ipsum Dolor Sit Amet Consectetur Adipiscing
            </h1>
            <p className="text-xl text-zinc-400 leading-relaxed">
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate.
            </p>
            
            <div className="mt-8 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-zinc-500">
                <span className="text-sm font-medium">JD</span>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">Jane Doe</p>
                <p className="text-xs text-zinc-500">May 16, 2026 · 5 min read</p>
              </div>
            </div>
          </div>
          
          {/* Article Body */}
          <div className="prose prose-invert max-w-none text-zinc-400 space-y-6">
            <p className="text-lg leading-8">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>

            <div>
              <h2 className="text-2xl font-semibold text-zinc-50 mt-12 mb-6 tracking-tight">
                1. Sed Ut Perspiciatis Unde Omnis
              </h2>
              <p className="leading-8 mb-4">
                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.
              </p>
              <p className="leading-8">
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>
            </div>

            <div className="my-10 border-l-2 border-zinc-700 pl-6 italic">
              <p className="text-xl text-zinc-300">
                &quot;Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.&quot;
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-zinc-50 mt-12 mb-6 tracking-tight">
                2. At Vero Eos Et Accusamus
              </h2>
              <p className="leading-8 mb-4">
                Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-4 text-zinc-300">
                <li>Temporibus autem quibusdam et aut officiis</li>
                <li>Debitis aut rerum necessitatibus saepe eveniet</li>
                <li>Voluptates repudiandae sint et molestiae non recusandae</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-zinc-50 mt-12 mb-6 tracking-tight">
                3. Excepteur Sint Occaecat Cupidatat
              </h2>
              <p className="leading-8">
                Sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>
            </div>
          </div>
        </Container>

        {/* CTA section */}
        <Container className="py-12 pb-24">
          <div className="flex flex-col items-center justify-center border-t border-white/5 pt-12">
            <Link href="/signup">
              <Button variant="outline" className="text-zinc-400 hover:text-zinc-100">
                Start tracking payments
              </Button>
            </Link>
          </div>
        </Container>
      </main>

      <footer className="border-t border-border mt-auto">
        <Container className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 text-sm text-zinc-600">
          <div>© {new Date().getFullYear()} Duely. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <span>Contact us:</span>
              <a href="mailto:support@duely.in" className="font-medium text-zinc-400 hover:text-zinc-100 transition-colors">
                support@duely.in
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
