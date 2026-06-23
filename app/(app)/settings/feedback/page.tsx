import { requireUser } from "@/lib/auth";
import { FeedbackForm } from "./feedback-form";

export const metadata = {
  title: "Feedback | Duely",
};

export default async function FeedbackPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-zinc-100">Feedback</h2>
        <p className="mt-1 text-sm text-zinc-400">
          We'd love to hear from you. Please let us know if you have any suggestions, found a bug, or need a new feature!
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <FeedbackForm />
      </div>
    </div>
  );
}
