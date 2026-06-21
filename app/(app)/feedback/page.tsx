import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
/*
 * feedback page 
 */
import Link from "next/link";

import { ArrowLeft, MessageSquareText } from "lucide-react";

import { submitFeedback } from "@/app/actions/feedback";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

// main function for the feedback page
// TODO: change wordings
export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col">

      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6">
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                Share feedback
              </h1>
              {/* TODO: change wording */}
              <p className="mt-3 text-base leading-7 text-zinc-500">
                What didn’t work, or what would you change? Be direct. Even small issues help.
              </p>
            </div>

            <Card className="bg-white/[0.035]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-primary" />
                  Message
                </CardTitle>
                {/* TODO: again wtf change wording here as well */}
                <CardDescription>
                  We read everything.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={submitFeedback} className="space-y-4">
                  <Textarea
                    name="message"
                    placeholder="Tell us what felt confusing, slow, or missing..."
                    rows={7}
                    required
                    maxLength={2000}
                  />
                  {error ? (
                    <p
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <Link href="/dashboard">
                      <Button type="button" variant="secondary" className="w-full sm:w-auto">
                        Cancel
                      </Button>
                    </Link>
                    <Button type="submit" className="w-full sm:w-auto">
                      Submit feedback
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  );
}
