import Link from "next/link";

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

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <Container className="flex h-14 items-center justify-between">
          <Link
            href="/dashboard"
            className="font-semibold tracking-tight text-zinc-900"
          >
            ← Back
          </Link>
          <div className="text-sm text-zinc-600">Feedback</div>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="py-10">
          <div className="mx-auto grid max-w-xl gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Send Feedback</CardTitle>
                <CardDescription>
                  We'd love to hear your thoughts, feature requests, or bug
                  reports.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={submitFeedback} className="space-y-4">
                  <Textarea
                    name="message"
                    placeholder="Tell us what's on your mind..."
                    rows={5}
                    required
                    maxLength={2000}
                  />
                  {error ? (
                    <p
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-end gap-2">
                    <Link href="/dashboard">
                      <Button type="button" variant="ghost">
                        Cancel
                      </Button>
                    </Link>
                    <Button type="submit">Send feedback</Button>
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
