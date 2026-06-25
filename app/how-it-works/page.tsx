import type { Metadata } from "next";
import { Container } from "@/components/site/container";
import { FadeIn } from "@/components/site/scroll-animation";
import { MacWindow } from "@/components/site/mac-window";
import { InteractiveAppDemo } from "@/components/site/interactive-app-demo";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "How it works | Duely",
  description: "Take a spin through the Action Center, track aging invoices in your Pipeline, and see your true cashflow inside Analytics.",
};

export default function HowItWorks() {
  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <section className="relative py-24 sm:py-32 bg-zinc-950/50 backdrop-blur-sm">
          <Container className="max-w-6xl">
            <div className="flex flex-col items-center text-center mb-16 mt-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 mb-6">
                <Zap className="h-6 w-6 text-indigo-300" />
              </div>
              <h1 className="text-pretty text-4xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-6xl max-w-4xl">
                See exactly how Duely gets you paid faster.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-zinc-400 max-w-2xl">
                Take a spin through the Action Center, track aging invoices in your Pipeline, and see your true cashflow inside Analytics.
              </p>
            </div>

            <FadeIn>
              <MacWindow icon={<Zap className="w-3 h-3 text-indigo-500" />} title="Duely Interactive Tour" className="h-[750px] p-0 overflow-hidden shadow-2xl shadow-indigo-500/10 border-white/10">
                <InteractiveAppDemo />
              </MacWindow>
            </FadeIn>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
