import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex flex-1 items-center justify-center">
        <Container className="py-16 text-center sm:py-24">
          <div className="space-y-6">
            <h1 className="text-7xl font-semibold tracking-[-0.045em] text-zinc-50 sm:text-8xl">
              404
            </h1>
            <h2 className="text-2xl font-medium tracking-tight text-zinc-200 sm:text-3xl">
              Page not found
            </h2>
            <p className="mx-auto max-w-md text-base leading-7 text-zinc-400">
              The page you are looking for doesn&apos;t exist or has been moved.
              Let&apos;s get you back on track.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Link href="/">
                <Button size="lg">Go home</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="secondary" size="lg">
                  View dashboard
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
