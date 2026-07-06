<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.


    # Billing Isolation
    Under absolutely no circumstances should you edit, modify,
  or delete `app/(app)/settings/billing/page.tsx`,
  `app/actions/billing.ts`, or any other billing-related files
  unless I explicitly instruct you to override this rule.

    # Strict Error Checking
    Before completing any task, you MUST run a build (`npm run build` or equivalent) 
    and a lint check (`npm run lint` or equivalent) to ensure no type errors, 
    lint errors, or broken pages were introduced by your changes.

    # Xero Integration Stability
    The Xero integration (OAuth flow, webhooks, payment pushing, syncing) is fully functional and stable. 
    DO NOT modify, refactor, or touch any Xero integration code (e.g., `lib/xero.ts`, `app/api/webhooks/xero/route.ts`, `lib/integrations-push.ts`, Xero settings pages) unless explicitly requested by the user to fix or change a specific part of it. If a specific fix is requested, ONLY modify the exact necessary parts for that fix and do not touch anything else in the integration.

<!-- END:nextjs-agent-rules -->
