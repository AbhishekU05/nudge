import { Container } from "@/components/site/container";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-white/10 bg-white/[0.04] ${className}`}
    />
  );
}

export default function NewCustomerLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-6 w-24" />
        </Container>
      </div>
      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-12 w-56" />
                <Skeleton className="h-5 w-full max-w-md" />
                <Skeleton className="h-5 w-2/3 max-w-sm" />
              </div>
              <div className="rounded-2xl border border-border bg-white/[0.035] p-6">
                <Skeleton className="h-7 w-44 mb-2" />
                <Skeleton className="h-4 w-64 mb-6" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16 sm:col-span-2" />
                  <Skeleton className="h-16 sm:col-span-2" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-44" />
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
