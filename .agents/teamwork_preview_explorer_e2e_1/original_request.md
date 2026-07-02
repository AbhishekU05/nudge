## 2026-07-02T13:11:39Z

You are teamwork_preview_explorer. Your working directory is /media/shad0w/Data1/Abhi_Data/Data/Programming_II/Projects/email_reminder/nudge/.agents/teamwork_preview_explorer_e2e_1.
Your task is to explore the codebase and design a comprehensive testing strategy for Next.js server actions.

Specifically:
1. Identify all 11 server actions in `app/actions/` (including feedback, leads, clients, automation, reminders, customers, drafts, late-fees, portal, integrations, auth). Analyze their function signatures, what Supabase tables they query/modify, and how they handle auth/redirects/revalidation.
2. Formulate a mocking and testing strategy. Since these are server actions using `@/lib/auth`, `@/lib/supabase/server`, `next/navigation` (redirect), and `next/cache` (revalidatePath), we need a way to mock these dependencies to run tests without a live Supabase server. Recommend whether we should use Vitest or write a custom test runner.
3. Plan the test cases to satisfy Tiers 1-4 with minimum thresholds:
   - Tier 1: >= 5 per feature
   - Tier 2: >= 5 per feature (boundary/corner cases)
   - Tier 3: pairwise combinations of major features
   - Tier 4: >= 5 realistic workload scenarios
4. Document your findings and test suite plan in /media/shad0w/Data1/Abhi_Data/Data/Programming_II/Projects/email_reminder/nudge/.agents/teamwork_preview_explorer_e2e_1/analysis.md.
5. Send a message back to the parent orchestrator (conversation ID: c33f25ab-14dc-4fda-ac1f-1e9b6cfd95a9) with a summary and a link to the analysis report.
