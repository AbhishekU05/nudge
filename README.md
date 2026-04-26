## Nudge

Minimal SaaS for sending recurring reminder emails to people who owe you money.

Tech: Next.js (App Router), TypeScript, Tailwind, Supabase, Stripe, Resend.

## Getting Started

### 1) Install

```bash
npm install
```

### 2) Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

### 3) Supabase setup

- Create a new Supabase project
- In the Supabase SQL editor, run `supabase/schema.sql`
- In Supabase Auth:
  - Enable **Email / Password**
  - Configure redirect URLs:
    - `http://localhost:3000/auth/callback`

### 4) Stripe setup

- Create a Stripe product with a **$1/month** recurring price
- Set `STRIPE_PRICE_ID_MONTHLY` to the price id (e.g. `price_...`)
- Create a webhook endpoint pointing to:
  - `http://localhost:3000/api/stripe/webhook`
- Subscribe to events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### 5) Resend setup

- Create an API key and set `RESEND_API_KEY`
- Set `RESEND_FROM_EMAIL` to a verified sender/domain

### 6) Cron setup (scheduled sends)

This MVP uses a protected HTTP endpoint you can call from any scheduler (Vercel Cron, GitHub Actions, cron-job.org, etc):

- Endpoint: `POST /api/cron/send-reminders`
- Header: `authorization: Bearer <CRON_SECRET>`

Example (every 10 minutes):

```bash
curl -X POST \
  -H "authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/cron/send-reminders"
```

First, run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase schema

The schema lives in `supabase/schema.sql` and includes:

- `profiles` (Stripe customer/subscription fields)
- `reminders` (recurring reminder configuration + unsubscribe token)
- `usage_events` (basic rate limiting)
- RLS policies (owner-only access)

## Unsubscribe support

Each reminder email includes an unsubscribe link that marks the reminder as unsubscribed. Unsubscribed reminders will no longer be sent.

## Notes

- Abuse prevention includes a minimum **24h** reminder interval and basic per-user rate limiting.
