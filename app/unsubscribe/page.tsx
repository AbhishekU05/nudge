import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex flex-1 items-center">
        <Container className="py-12">
          <Card className="mx-auto max-w-lg bg-white/[0.035]">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-200">
                <AlertCircle className="h-5 w-5" />
              </div>
              <CardTitle>Missing link</CardTitle>
              <CardDescription>
                This unsubscribe link is incomplete.
              </CardDescription>
            </CardHeader>
          </Card>
        </Container>
      </div>
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("reminders")
    .update({ unsubscribed: true, active: false })
    .eq("unsubscribe_token", token);

  return (
    <div className="flex flex-1 items-center">
      <Container className="py-12">
        <Card className="mx-auto max-w-lg bg-white/[0.035]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300">
              {error ? (
                <AlertCircle className="h-5 w-5 text-red-200" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-200" />
              )}
            </div>
            <CardTitle>{error ? "Request failed" : "Unsubscribed"}</CardTitle>
            <CardDescription>
              {error
                ? "We could not process your request."
                : "You have been unsubscribed and will not receive further reminders."}
            </CardDescription>
          </CardHeader>
          {error ? (
            <CardContent className="text-center text-sm text-zinc-500">
              An unexpected error occurred.
            </CardContent>
          ) : null}
        </Card>
      </Container>
    </div>
  );
}
