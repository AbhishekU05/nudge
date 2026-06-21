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
    <div className="flex min-h-screen flex-col w-full">
      <main id="main-content" className="flex-1 w-full">
        <Container className="py-8 sm:py-10 max-w-[1600px]">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-4 w-full">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-6 w-96 max-w-full" />
            </div>
          </div>
          <div className="grid gap-5">
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </Container>
      </main>
    </div>
  );
}
