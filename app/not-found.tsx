import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              width={24}
              height={24}
              alt="Duely Logo"
              className="h-6 w-6 rounded-md grayscale"
            />
            <span className="text-lg font-semibold tracking-tight text-zinc-50">
              Duely
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </Container>
      </header>

      <main className="flex flex-1 items-center justify-center">
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

      <footer className="border-t border-border">
        <Container className="py-8 text-center text-sm text-zinc-600">
          © {new Date().getFullYear()} Duely
        </Container>
      </footer>
    </div>
  );
}
