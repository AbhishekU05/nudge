"use server";
import { applyLateFees } from "@/lib/inngest/functions/apply-late-fees";
export async function runLateFeesNow() {
  // This invokes the actual handler logic synchronously for testing
  const handler = (applyLateFees as any).fn;
  if (handler) {
    await handler({ event: { data: {} }, step: { run: async (name: string, fn: any) => await fn() } } as any);
  }
}
