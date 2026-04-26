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
      <div className="flex flex-1 items-center bg-zinc-50">
        <Container className="py-12">
          <Card className="mx-auto max-w-lg">
            <CardHeader>
              <CardTitle>Unsubscribe</CardTitle>
              <CardDescription>Missing unsubscribe token.</CardDescription>
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
    <div className="flex flex-1 items-center bg-zinc-50">
      <Container className="py-12">
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>Unsubscribe</CardTitle>
            <CardDescription>
              {error
                ? "We couldn’t process your request."
                : "You’ve been unsubscribed. You won’t receive further reminders."}
            </CardDescription>
          </CardHeader>
          {error ? (
            <CardContent className="text-sm text-zinc-600">
              An unexpected error occurred.
            </CardContent>
          ) : null}
        </Card>
      </Container>
    </div>
  );
}

