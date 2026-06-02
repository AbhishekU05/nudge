# Supabase Schema

This is the final schema after `20260524120000_cleanup_supabase_schema.sql`.
Use `schema.sql` as the canonical fresh-database definition and apply numbered
migrations for existing databases.

## Tables

### `profiles`

One row per `auth.users` user. Stores billing state, signup attribution,
Google OAuth tokens used for Gmail sending, and Gmail integration state.

Primary key: `user_id`

Important columns: `razorpay_subscription_id`, `razorpay_subscription_status`,
`razorpay_renews_at`, `referral_source`, `google_access_token`,
`google_refresh_token`, `gmail_connected_email`, `gmail_oauth_state`

### `customers`

One row per customer balance. This table also stores optional reminder
automation settings for that customer.

Primary key: `id`

Important columns: `user_id`, `recipient_name`, `recipient_email`,
`amount_owed`, `amount_paid`, `currency`, `due_date`, `workflow_status`,
`promised_date`, `promise_notes`, `internal_notes`, `custom_message`,
`payment_link`, `client_paid_at`, `reminder_frequency_days`, `next_send_at`,
`last_sent_at`, `active`, `unsubscribed`, `unsubscribe_token`,
`stripe_invoice_id`, `xero_invoice_id`

Valid `workflow_status` values: `outstanding`, `promised`, `partial`, `paid`,
`overdue`, `written_off`

### `customer_events`

Unified timeline for customer activity. This replaces the old `payment_logs`
and `followup_logs` tables.

Primary key: `id`

Event types:

- `payment`: requires `amount`, `currency`, and `payment_source`
- `followup`: requires `followup_method` and `followup_outcome`

Valid `payment_source` values: `user`, `customer`, `adjustment`

Valid `followup_method` values: `email`, `call`, `whatsapp`, `other`

Valid `followup_outcome` values: `no_response`, `promise_made`,
`partial_payment`, `paid_in_full`

### `usage_events`

Append-only rate-limit and abuse-monitoring events.

Primary key: `id`

Important columns: `user_id`, `event_type`, `created_at`

### `stripe_connections`

Per-user Stripe Connect/manual webhook configuration.

Primary key: `user_id`

Important columns: `stripe_account_id`, `access_token`, `webhook_secret`

### `integrations`

Per-user third-party data sync connections. Currently supports Xero.

Primary key: `(user_id, provider)`

Important columns: `provider`, `access_token`, `refresh_token`, `expires_at`,
`tenant_id`, `last_synced_at`

### `leads`

Landing-page email capture. Public clients can insert only; reads should use
the service role.

Primary key: `id`

Important columns: `email`, `created_at`

## Removed Or Consolidated

- `reminders` was renamed to `customers` because rows represent customer
  balance records with optional reminder automation.
- `payment_logs` and `followup_logs` were consolidated into
  `customer_events`.
- `customers.paid` was removed. Paid state is derived from
  `workflow_status = 'paid'` or `client_paid_at is not null`.
- `customers.relationship_tag` was removed because it was unused and had no
  write path.

## Indexes

- `customers_user_created_idx`: dashboard customer list by owner and recency.
- `customers_user_email_idx`: duplicate-customer checks and Stripe invoice
  customer matching.
- `customers_user_status_idx`: dashboard pipeline/status filtering.
- `customers_next_send_at_idx`: cron lookup for due active reminders.
- `customers_unsubscribe_token_idx`: one-click unsubscribe/payment-confirmation
  lookups.
- `customers_stripe_invoice_id_idx`: Stripe invoice webhook updates.
- `customers_user_xero_invoice_id_idx`: idempotent Xero invoice imports.
- `customer_events_customer_created_idx`: per-customer timeline display.
- `customer_events_user_created_idx`: dashboard activity loading.
- `customer_events_user_type_created_idx`: event-type filtered activity queries.
- `usage_events_user_type_created_idx`: minute/day rate-limit counts.
- `stripe_connections_webhook_configured_idx`: Stripe webhook secret scan.
- `integrations_provider_idx`: scheduled provider sync lookup.
- `integrations_provider_last_synced_idx`: stale integration discovery.
- `leads_created_at_idx`: admin lead review by recency.

## Security Model

RLS is enabled on every public table. User-owned tables use owner-only policies
based on `auth.uid() = user_id`. `leads` intentionally has an insert policy but
no select policy so public clients cannot read captured emails.
