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
          <Link href="/for-freelancers" className="hover:text-zinc-300 transition-colors min-h-[44px] flex items-center">Freelancers</Link>
          <Link href="/for-agencies" className="hover:text-zinc-300 transition-colors min-h-[44px] flex items-center">Agencies</Link>
          <Link href="/for-consultants" className="hover:text-zinc-300 transition-colors min-h-[44px] flex items-center">Consultants</Link>
          <Link href="/alternatives/duely-vs-paidnice" className="hover:text-zinc-300 transition-colors min-h-[44px] flex items-center">Vs Paidnice</Link>
          <Link href="/alternatives/duely-vs-chaser" className="hover:text-zinc-300 transition-colors min-h-[44px] flex items-center">Vs Chaser</Link>
          <Link href="/for/marketing-agencies" className="hover:text-zinc-300 transition-colors min-h-[44px] flex items-center">For Marketing Agencies</Link>
          <Link href="/for/web-design-agencies" className="hover:text-zinc-300 transition-colors min-h-[44px] flex items-center">For Web Design Agencies</Link>
          <Link href="/integrations/quickbooks" className="hover:text-zinc-300 transition-colors min-h-[44px] flex items-center">QuickBooks Sync</Link>
          <Link href="/use-case/automate-invoice-reminders" className="hover:text-zinc-300 transition-colors min-h-[44px] flex items-center">Automate Reminders</Link>
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
