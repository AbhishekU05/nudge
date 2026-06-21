import { Container } from "@/components/site/container";
import { DraftList } from "@/components/site/draft-list";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DraftsPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: drafts } = await supabase
    .from("email_drafts")
    .select("*, clients(name, email)")
    .eq("user_id", user.id)
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50">Approval Queue</h1>
            <p className="mt-2 text-zinc-400">Review and approve statement-style reminder emails before they are sent.</p>
          </div>
          
          <DraftList initialDrafts={drafts || []} />
        </Container>
      </main>
    </div>
  );
}
