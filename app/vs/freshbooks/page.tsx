import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { FadeIn } from "@/components/site/scroll-animation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Duely vs FreshBooks: Which Is Right for You? (2026)",
  description: "FreshBooks handles invoicing. Duely handles what comes after. Here's exactly how they differ and which fits your workflow.",
  alternates: {
    canonical: "/vs/freshbooks",
  },
};

export default function VsFreshBooksPage() {
  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <SiteHeader />
      <main id="main-content" className="flex-1 pb-24 pt-16 sm:pb-32 sm:pt-24 lg:pb-40 bg-background">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
              Duely vs FreshBooks
            </h1>
            <p className="mt-6 text-xl text-zinc-400">
              They create invoices. We help you collect on them.
            </p>
          </div>

          <div className="mt-16 mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-900/80 text-zinc-100">
                <tr>
                  <th className="px-6 py-4 font-medium border-b border-white/5">Feature</th>
                  <th className="px-6 py-4 font-medium border-b border-white/5 text-indigo-300">Duely</th>
                  <th className="px-6 py-4 font-medium border-b border-white/5">FreshBooks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">Invoice creation</td>
                  <td className="px-6 py-4 text-zinc-500"><X className="inline h-4 w-4 mr-2" /> (use your existing tool)</td>
                  <td className="px-6 py-4 text-emerald-400"><Check className="inline h-4 w-4" /></td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">Payment promise tracking</td>
                  <td className="px-6 py-4 text-emerald-400"><Check className="inline h-4 w-4" /></td>
                  <td className="px-6 py-4 text-zinc-500"><X className="inline h-4 w-4" /></td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">Partial payment logging</td>
                  <td className="px-6 py-4 text-emerald-400"><Check className="inline h-4 w-4" /></td>
                  <td className="px-6 py-4 text-zinc-500"><X className="inline h-4 w-4 mr-2" /> / limited</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">Follow-up timeline per client</td>
                  <td className="px-6 py-4 text-emerald-400"><Check className="inline h-4 w-4" /></td>
                  <td className="px-6 py-4 text-zinc-500"><X className="inline h-4 w-4" /></td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">Gmail-connected reminders (from your address)</td>
                  <td className="px-6 py-4 text-emerald-400"><Check className="inline h-4 w-4" /></td>
                  <td className="px-6 py-4 text-zinc-500"><X className="inline h-4 w-4" /></td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">QuickBooks / Xero sync</td>
                  <td className="px-6 py-4 text-emerald-400"><Check className="inline h-4 w-4" /></td>
                  <td className="px-6 py-4 text-emerald-400"><Check className="inline h-4 w-4" /></td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">Tone-based message drafting</td>
                  <td className="px-6 py-4 text-emerald-400"><Check className="inline h-4 w-4" /></td>
                  <td className="px-6 py-4 text-zinc-500"><X className="inline h-4 w-4" /></td>
                </tr>
                <tr className="bg-zinc-900/30">
                  <td className="px-6 py-4 font-medium text-zinc-100">Price</td>
                  <td className="px-6 py-4 font-medium text-indigo-300">$29/mo or $199 lifetime</td>
                  <td className="px-6 py-4 font-medium text-zinc-300">Starts at $19/mo</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mx-auto mt-16 max-w-4xl grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
              <h2 className="text-xl font-semibold text-zinc-50">Who Duely is for</h2>
              <p className="mt-4 leading-relaxed text-zinc-400">
                Freelancers and agencies who already have an invoicing tool but struggle with the follow-up process, managing partial payments, and keeping track of payment promises.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
              <h2 className="text-xl font-semibold text-zinc-50">Who FreshBooks is for</h2>
              <p className="mt-4 leading-relaxed text-zinc-400">
                Small businesses that need a robust, all-in-one double-entry accounting software with strong time-tracking and expense management features.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-8 sm:p-12 text-center">
            <h2 className="text-2xl font-semibold text-zinc-50">You don&apos;t have to choose (Use both)</h2>
            <p className="mt-4 text-lg leading-relaxed text-zinc-400 mx-auto max-w-2xl">
              Duely isn&apos;t built to replace FreshBooks. It&apos;s built to work alongside it. Let FreshBooks handle the heavy lifting of accounting and invoice generation. When an invoice becomes overdue, plug Duely into your workflow to manage the delicate process of actually getting paid without straining your client relationships.
            </p>
            <div className="mt-8">
              <Link href="/signup">
                <Button size="lg" className="shadow-lg shadow-indigo-500/20">
                  Start your free trial
                  <ArrowRight className="ml-2 h-4 w-4" />
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
