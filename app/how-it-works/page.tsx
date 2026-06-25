import type { Metadata } from "next";
import { FadeIn } from "@/components/site/scroll-animation";
import { MacWindow } from "@/components/site/mac-window";
import { InteractiveAppDemo } from "@/components/site/interactive-app-demo";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const metadata: Metadata = {
  title: "How it works | Duely",
  description: "Take a spin through the Action Center, track aging invoices in your Pipeline, and see your true cashflow inside Analytics.",
};

export default function HowItWorks() {
  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <section className="relative bg-zinc-950/50 pb-24 pt-12 backdrop-blur-sm sm:pb-32 sm:pt-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-10 flex flex-col items-center text-center">
              <h1 className="max-w-4xl text-pretty text-4xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-6xl">
                See exactly how Duely gets you paid faster.
              </h1>
            </div>
          </div>

          <div className="w-full px-2 sm:px-4 lg:px-8 max-w-[100vw]">
            <FadeIn>
              <MacWindow title="Duely Interactive Tour" className="h-[95vh] p-0 overflow-hidden shadow-2xl shadow-indigo-500/10 border-white/10">
                <InteractiveAppDemo />
              </MacWindow>
            </FadeIn>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
