import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/site/container";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-zinc-950">
      <Container className="flex flex-col sm:flex-row items-center justify-between gap-6 py-10 text-sm text-zinc-500">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            width={20}
            height={20}
            alt="Duely Logo"
            className="h-5 w-5 rounded-sm opacity-50 grayscale"
          />
          <span>© {new Date().getFullYear()} Duely. All rights reserved.</span>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4">
          <Link href="/about" className="hover:text-zinc-300 transition-colors min-h-[44px] flex items-center">About</Link>
          <Link href="/articles" className="hover:text-zinc-300 transition-colors min-h-[44px] flex items-center">Articles</Link>
          <Link href="/faq" className="hover:text-zinc-300 transition-colors min-h-[44px] flex items-center">FAQ</Link>
          <Link href="/terms" className="hover:text-zinc-300 transition-colors min-h-[44px] flex items-center">Terms</Link>
          <Link href="/privacy" className="hover:text-zinc-300 transition-colors min-h-[44px] flex items-center">Privacy</Link>
          <div className="flex items-center gap-1.5 sm:ml-2">
            <span className="hidden sm:inline">Contact us:</span>
            <a href="mailto:abhishek@duely.in" className="font-medium text-zinc-400 hover:text-zinc-200 transition-colors min-h-[44px] flex items-center">
              abhishek@duely.in
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
