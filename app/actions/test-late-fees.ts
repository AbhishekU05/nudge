"use server";
import { applyLateFees } from "@/lib/inngest/functions/apply-late-fees";
export async function runLateFeesNow() {
  // This invokes the actual handler logic synchronously for testing
  const handler = (applyLateFees as unknown as { fn?: (args: Record<string, unknown>) => Promise<void> }).fn;
  if (handler) {
    await handler({ event: { data: {} }, step: { run: async (name: string, fn: () => Promise<unknown>) => await fn() } } as unknown as Record<string, unknown>);
  }
}
