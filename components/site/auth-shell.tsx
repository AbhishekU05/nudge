import type { ReactNode } from "react";

import Image from "next/image";

import Link from "next/link";

import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center">
      <Container className="py-10 sm:py-16">
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(24rem,1fr)] lg:items-center">
          <div className="hidden lg:block">
            <Link href="/" className="mb-10 inline-flex items-center gap-3">
              <Image
                src="/icon.png"
                width={24}
                height={24}
                alt="Duely Logo"
                className="h-6 w-6 rounded-md grayscale"
              />
              <span className="font-semibold tracking-tight text-zinc-50">
                Duely
              </span>
            </Link>
            <p className="max-w-md text-4xl font-semibold tracking-tight text-zinc-50">
              Get paid on time. Without awkward follow-ups.
            </p>
            <div className="mt-8 max-w-md rounded-2xl border border-border bg-white/[0.03] p-5">
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
                Workflow
              </div>
              <div className="mt-5 space-y-4 text-sm text-zinc-300">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs text-zinc-400">
                    1
                  </span>
                  Create a reminder in under a minute
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs text-zinc-400">
                    2
                  </span>
                  Let Duely follow up automatically
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs text-zinc-400">
                    3
                  </span>
                  Mark it resolved once paid
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center justify-center lg:hidden">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/icon.png"
                  width={24}
                  height={24}
                  alt="Duely Logo"
                  className="h-6 w-6 rounded-md grayscale"
                />
                <span className="font-semibold tracking-tight text-zinc-50">
                  Duely
                </span>
              </Link>
            </div>
            <Card className="bg-card/90">
              <CardHeader className="p-7 pb-3">
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="p-7 pt-4">{children}</CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
