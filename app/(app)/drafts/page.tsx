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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Queue</h1>
            <Badge variant="secondary" className="bg-white/5 hover:bg-white/10">{(drafts || []).length} waiting</Badge>
          </div>
          <p className="mt-2 text-zinc-400 max-w-xl">
            Review and approve automated emails before they are sent. 
          </p>
          
          <DraftList initialDrafts={drafts || []} />
        </Container>
      </main>
    </div>
  );
}
