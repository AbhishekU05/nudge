import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import AffonsoEmbed from "./affonso-embed";

export const metadata: Metadata = {
  title: "Referrals",
  description: "Earn rewards by referring others to Duely.",
};

export default async function ReferralsPage() {
  await requireUser();

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Refer &amp; Earn</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Share your referral link and earn rewards for every team that subscribes through you.
        </p>
      </div>
      <AffonsoEmbed />
    </div>
  );
}
