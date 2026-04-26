import type { ReactNode } from "react";

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
            <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-900">
              Nudge
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

