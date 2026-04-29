import { Container } from "@/components/site/container";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-white/10 bg-white/[0.04] ${className}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-8 w-44" />
        </Container>
      </div>

      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-12 w-52" />
              <Skeleton className="h-5 w-full max-w-xl" />
            </div>
            <Skeleton className="h-24 w-full lg:w-80" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-3 rounded-2xl border border-border bg-white/[0.035] p-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-72" />
              <Skeleton className="h-36" />
              <Skeleton className="h-36" />
            </div>
            <div className="space-y-5">
              <Skeleton className="h-72" />
              <Skeleton className="h-80" />
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
