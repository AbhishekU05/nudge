import { Container } from "@/components/site/container";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-white/10 bg-white/[0.04] ${className}`}
    />
  );
}

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-border bg-background/80">
        <Container className="flex h-16 items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-8 w-40" />
        </Container>
      </div>
      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-8 space-y-4">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-12 w-full max-w-xl" />
            <Skeleton className="h-5 w-full max-w-2xl" />
          </div>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <Skeleton className="h-96" />
            <div className="space-y-5">
              <Skeleton className="h-64" />
              <Skeleton className="h-72" />
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
