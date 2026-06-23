import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/site/container";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export default function SEOIndexTemplate({ 
  title, 
  description, 
  links 
}: { 
  title: string; 
  description: string; 
  links: { href: string; label: string; description?: string }[] 
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 pb-24">
        {/* Hero */}
        <section className="relative pt-32 pb-16 px-6 border-b border-white/5">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(79,70,229,0.15),transparent_60%),radial-gradient(ellipse_at_80%_40%,rgba(168,85,247,0.08),transparent_50%)]" />
          <Container className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-100 mb-6">
              {title}
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl">
              {description}
            </p>
          </Container>
        </section>

        {/* Links Grid */}
        <section className="pt-16 px-6">
          <Container className="max-w-4xl">
            <div className="grid sm:grid-cols-2 gap-4">
              {links.map((link, i) => (
                <Link 
                  key={i} 
                  href={link.href}
                  className="group block p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all"
                >
                  <h3 className="text-lg font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                    {link.label}
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </h3>
                  {link.description && (
                    <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                      {link.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
