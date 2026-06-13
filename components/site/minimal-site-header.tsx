import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MinimalSiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <Image
            src="/logo.svg"
            width={36}
            height={36}
            alt="Duely Logo"
            className="h-9 w-9 rounded-lg shadow-sm"
          />
          <span className="text-lg font-semibold text-zinc-50">Duely</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/tools" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100 sm:inline-flex">
            Tools
          </Link>
          <Link href="/signup">
            <Button size="sm" className="h-9 px-3 sm:px-4">
              <span className="hidden sm:inline">Start Free Trial</span>
              <span className="inline sm:hidden">Get Started</span>
              <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
