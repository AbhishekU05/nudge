import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/site/container";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-zinc-950">
      <Container className="py-12 sm:py-16 text-sm text-zinc-500">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 w-full mb-12">
          
          <div className="col-span-2 lg:col-span-1 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
              <Image
                src="/logo.svg"
                width={28}
                height={28}
                alt="Duely Logo"
                className="h-7 w-7 rounded-md opacity-80"
              />
              <span className="text-lg font-semibold tracking-tight text-zinc-200">Duely</span>
            </Link>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
              Collect what you're owed, keep the relationship. The intelligent collections engine for agencies and freelancers.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-zinc-100 mb-1">Product</h3>
            <Link href="/how-it-works" className="hover:text-zinc-300 transition-colors">How it works</Link>
            <Link href="/features" className="hover:text-zinc-300 transition-colors">Features</Link>
            <Link href="/#pricing" className="hover:text-zinc-300 transition-colors">Pricing</Link>
            <Link href="/integrations/quickbooks" className="hover:text-zinc-300 transition-colors">QuickBooks Sync</Link>
            <Link href="/use-case/automate-invoice-reminders" className="hover:text-zinc-300 transition-colors">Automate Reminders</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-zinc-100 mb-1">Use Cases</h3>
            <Link href="/for-freelancers" className="hover:text-zinc-300 transition-colors">Freelancers</Link>
            <Link href="/for-agencies" className="hover:text-zinc-300 transition-colors">Agencies</Link>
            <Link href="/for-consultants" className="hover:text-zinc-300 transition-colors">Consultants</Link>
            <Link href="/for/marketing-agencies" className="hover:text-zinc-300 transition-colors">Marketing Agencies</Link>
            <Link href="/for/web-design-agencies" className="hover:text-zinc-300 transition-colors">Web Design Agencies</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-zinc-100 mb-1">Compare & Learn</h3>
            <Link href="/alternatives/duely-vs-paidnice" className="hover:text-zinc-300 transition-colors">Vs Paidnice</Link>
            <Link href="/alternatives/duely-vs-chaser" className="hover:text-zinc-300 transition-colors">Vs Chaser</Link>
            <Link href="/articles" className="hover:text-zinc-300 transition-colors">Articles & Guides</Link>
            <Link href="/tools" className="hover:text-zinc-300 transition-colors">Free Tools</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-zinc-100 mb-1">Company</h3>
            <Link href="/about" className="hover:text-zinc-300 transition-colors">About</Link>
            <Link href="/faq" className="hover:text-zinc-300 transition-colors">FAQ</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
          <span>© {new Date().getFullYear()} Duely. All rights reserved.</span>
          <div className="flex items-center gap-1.5">
            <span>Contact us:</span>
            <a href="mailto:abhishek@duely.in" className="font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
              abhishek@duely.in
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
