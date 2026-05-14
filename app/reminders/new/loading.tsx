import { Container } from "@/components/site/container";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-white/10 bg-white/[0.04] ${className}`}
    />
  );
}

export default function SetupAutomationLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-6 w-36" />
        </Container>
      </div>
      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mx-auto max-w-5xl space-y-8">
            {/* Heading */}
            <div className="space-y-3">
              <Skeleton className="h-12 w-72" />
              <Skeleton className="h-5 w-full max-w-md" />
            </div>

            {/* Customer context card */}
            <Skeleton className="h-20 w-full" />

            {/* Form + preview grid */}
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="space-y-7">
                {/* Tone picker */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <div className="grid grid-cols-3 gap-3">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                  </div>
                </div>
                {/* Note textarea */}
                <Skeleton className="h-32 w-full" />
                {/* Payment link */}
                <Skeleton className="h-14 w-full" />
                {/* Frequency */}
                <Skeleton className="h-14 w-48" />
                {/* Submit */}
                <Skeleton className="h-10 w-44" />
              </div>
              {/* Email preview */}
              <Skeleton className="h-[420px]" />
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
