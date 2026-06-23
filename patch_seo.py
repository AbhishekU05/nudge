import re

with open("components/site/seo-page-template.tsx", "r") as f:
    seo_text = f.read()

with open("app/page.tsx", "r") as f:
    page_text = f.read()

# Extract Bento box grid from page.tsx
pattern_bento = re.compile(r"(\{/\* BENTO BOX GRID \*/\}.*?\{/\* PRICING SECTION \*/\})", re.DOTALL)
match_bento = pattern_bento.search(page_text)
bento_grid = match_bento.group(1) if match_bento else ""

# Replace the specific Hero section
hero_replacement = """      {/* Hero Section */}
      <section className="relative pt-24 pb-20 sm:pt-32 sm:pb-32 lg:pb-40">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(79,70,229,0.15),transparent_60%),radial-gradient(ellipse_at_80%_40%,rgba(168,85,247,0.08),transparent_50%)]" />
        <Container>
          <FadeIn className="max-w-4xl mx-auto text-center">
            <h1 className="text-pretty text-5xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-6xl lg:text-7xl lg:leading-[1.05] mb-6">
              {data.h1}
            </h1>
            <p className="mt-6 text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              {data.subtitle}
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-indigo-500/20 w-full sm:w-auto">
                  {data.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-zinc-500 mt-6">7-day free trial • No credit card required</p>
          </FadeIn>
        </Container>
      </section>"""

seo_text = re.sub(r"\{/\* Hero Section \*/\}.*?\{/\* Pain Point Section \*/\}", hero_replacement + "\n\n      {/* Pain Point Section */}", seo_text, flags=re.DOTALL)

# Replace Pain Point and Features container
pain_point_replacement = """      {/* Pain Point Section */}
      <section className="py-20 bg-zinc-950/50 border-y border-white/5 backdrop-blur-sm">
        <Container>
          <FadeIn className="max-w-3xl mx-auto">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50" />
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-100 mb-6">The Real Problem</h2>
              <p className="text-lg text-zinc-400 leading-relaxed">
                {data.painPoint}
              </p>
            </div>
          </FadeIn>
        </Container>
      </section>"""

seo_text = re.sub(r"\{/\* Pain Point Section \*/\}.*?\{/\* Features Section \*/\}", pain_point_replacement + "\n\n      {/* Features Section */}", seo_text, flags=re.DOTALL)

features_replacement = """      {/* Features Section */}
      <section className="py-24">
        <Container>
          <div className="max-w-5xl mx-auto">
            <FadeIn className="text-center mb-16">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-100 mb-4">Why Duely is Built for You</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                We focus on one thing: getting your overdue invoices paid without ruining your client relationships.
              </p>
            </FadeIn>
            
            <FadeIn className="grid md:grid-cols-3 gap-8 mb-24">
              {data.features.map((feature, index) => (
                <div key={index} className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.04] transition-colors">
                  <div className="h-12 w-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20">
                    <CheckCircle2 className="h-6 w-6 text-indigo-400" />
                  </div>
                  <p className="text-zinc-300 font-medium leading-relaxed">{feature}</p>
                </div>
              ))}
            </FadeIn>"""

seo_text = re.sub(r"\{/\* Features Section \*/\}.*?(?=\{/\* Unique Content Section \*/\})", features_replacement + "\n\n          ", seo_text, flags=re.DOTALL)

# Add closing tags for Features section and Container
unique_content_pattern = re.compile(r"(\{/\* Unique Content Section \*/\}.*?)(?=\{/\* Differentiators Section \*/\})", re.DOTALL)
unique_content_match = unique_content_pattern.search(seo_text)
unique_content_code = unique_content_match.group(1) if unique_content_match else ""

seo_text = re.sub(unique_content_pattern, unique_content_code + "\n        </Container>\n      </section>\n\n      ", seo_text)


# Replace Differentiators with Bento Grid
bento_grid_clean = bento_grid.replace('{/* PRICING SECTION */}', '')
seo_text = re.sub(r"\{/\* Differentiators Section \*/\}.*?\{/\* Bottom CTA \*/\}", bento_grid_clean + "\n      {/* Bottom CTA */}", seo_text, flags=re.DOTALL)


# Replace CTA section
cta_replacement = """      {/* Bottom CTA */}
      <section className="relative py-24 sm:py-32 overflow-hidden border-t border-white/5 bg-background">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -ml-[40rem] h-[40rem] w-[80rem] rounded-full bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] mix-blend-overlay" />
        </div>

        <Container>
          <SlideUp>
            <div className="relative z-10 mx-auto max-w-2xl text-center">
              <h2 className="text-pretty text-4xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-5xl">
                Ready to fix your cash flow?
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                Join hundreds of agencies and freelancers using Duely to automate their accounts receivable.
              </p>

              <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-indigo-500/20 w-full sm:w-auto">
                    Start Your 7-day free trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-zinc-500 mt-6">Just $29/month after trial • Cancel anytime</p>
            </div>
          </SlideUp>
        </Container>
      </section>"""

seo_text = re.sub(r"\{/\* Bottom CTA \*/\}.*?\{/\* Internal SEO Linking \*/\}", cta_replacement + "\n\n      {/* Internal SEO Linking */}", seo_text, flags=re.DOTALL)


# Add missing imports
imports_to_add = """import { Container } from "@/components/site/container";
import { FadeIn, SlideUp } from "@/components/site/scroll-animation";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, CreditCard, Activity, User } from "lucide-react";"""

if "import { Container }" not in seo_text:
    seo_text = seo_text.replace('import type { SEOPageData } from "@/lib/seo-data";', 'import type { SEOPageData } from "@/lib/seo-data";\n' + imports_to_add)

with open("components/site/seo-page-template.tsx", "w") as f:
    f.write(seo_text)

print("SEO Template patched successfully!")
