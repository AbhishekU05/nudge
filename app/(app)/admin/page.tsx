import { requireAdmin } from "@/lib/auth";
import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { testDigestEmail } from "./actions";

export default async function AdminDashboardPage() {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-8">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
              Admin Dashboard
            </h1>
            <p className="mt-3 text-base text-zinc-400">
              Internal tools and testing capabilities.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-indigo-400" />
                  Weekly Digest Email
                </CardTitle>
                <CardDescription>
                  Manually trigger the weekly snapshot email. 
                  This test button will ONLY send the digest to your own admin email address.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={testDigestEmail}>
                  <Button type="submit" variant="secondary">
                    Send Test Digest
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  );
}
