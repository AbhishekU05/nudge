import Link from "next/link";

import { ArrowLeft, LifeBuoy } from "lucide-react";

import { submitSupport } from "@/app/actions/support";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <div className="text-sm text-zinc-500">Support</div>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6">
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                Contact Support
              </h1>
              <p className="mt-3 text-base leading-7 text-zinc-500">
                Need help or have a question? Drop us a message and we'll get back to you as soon as possible.
              </p>
            </div>

            <Card className="bg-white/[0.035]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LifeBuoy className="h-4 w-4 text-primary" />
                  Send us a message
                </CardTitle>
                <CardDescription>
                  We typically reply within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {success ? (
                  <div className="space-y-4">
                    <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">
                      {success}
                    </p>
                    <Link href="/">
                      <Button variant="secondary" className="w-full">
                        Return to home
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <form action={submitSupport} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-zinc-200">
                        Email address
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium text-zinc-200">
                        Message
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="How can we help?"
                        rows={7}
                        required
                        maxLength={2000}
                      />
                    </div>
                    {error ? (
                      <p
                        className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                        role="alert"
                      >
                        {error}
                      </p>
                    ) : null}
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                      <Link href="/">
                        <Button type="button" variant="ghost" className="w-full sm:w-auto">
                          Cancel
                        </Button>
                      </Link>
                      <Button type="submit" className="w-full sm:w-auto">
                        Send message
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  );
}
