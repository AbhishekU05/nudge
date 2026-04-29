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
    <div className="flex flex-1 items-center bg-zinc-50">
      <Container className="py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center justify-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Nudge Logo" width={32} height={32} className="h-8 w-auto" />
              <span className="text-xl font-semibold tracking-tight text-zinc-900">Nudge</span>
            </Link>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}

