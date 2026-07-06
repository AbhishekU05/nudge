# Database Management & Data Retention

This document outlines the architectural strategies Duely uses to manage database size, maintain data integrity, and prevent the system from becoming bogged down by excessive historical data.

## 1. Data Retention & Pruning Strategy

To keep Supabase hosting costs strictly controlled and query performance lightning fast, Duely enforces a strict limit on the volume of historical data it stores.

### **The 2-Year Sync Rule**
When a new organization connects their accounting software (Xero or QuickBooks), the initial Inngest background sync enforces the following filters:
- **Unpaid / Overdue Invoices:** Pulled entirely, regardless of age. If an invoice from 5 years ago is still unpaid, it enters the system to be chased.
- **Paid Invoices:** Only pulled if they were paid within the last **2 years**. This provides enough historical data to generate Year-Over-Year (YoY) financial analytics (e.g., Average Days to Pay) without hoarding decades of irrelevant data.

### **The 2.5-Year Pruning Job (Planned)**
To create a permanent ceiling on database size, an automated background cron job runs on a schedule to permanently delete "stale" data.
- Any invoice that has been marked as `paid` and is older than **2.5 years** is permanently deleted from the database.
- Thanks to `ON DELETE CASCADE` rules at the database level, deleting an invoice automatically wipes out its associated timeline `events`, `applied_late_fees`, and `email_drafts`, cleanly freeing up space.

## 2. Integrity & Deduplication

Because Duely interacts with aggressive, real-time external systems via Webhooks and Background Syncs, we employ specific logic to prevent corrupted or duplicate data.

### **Payment Soft-Deduplication**
When a manual payment is registered in Duely, Duely pushes that payment to Xero/QuickBooks. Almost instantly, Xero/QuickBooks fires a Webhook back to Duely saying "A payment was just created!" 
- Instead of blindly inserting a duplicate row, the webhook handlers utilize **Soft-Deduplication**. 
- They check if a manual payment exists with the exact same `amount`, `date`, and `invoice_id`. If it does, the webhook simply links the external `reference` ID to the existing row instead of duplicating it.

### **The "Dual Sync Truth" Rule**
Webhooks and local user actions can sometimes race each other. To prevent an older webhook payload from overwriting a more recent action taken by a user inside the Duely dashboard:
- Every update checks the `updated_at` timestamp. 
- If a webhook payload has an older timestamp than the record currently residing in the database, the webhook payload is safely ignored. 
- This guarantees that the most recent action always acts as the ultimate source of truth.

### **Webhook Idempotency**
Every webhook received from an integration is logged into a `webhook_events` table using a uniquely generated hash (e.g., `realmId_entityName_entityId_lastUpdated`). If the integration provider accidentally fires the exact same webhook payload twice (which happens frequently), the database rejects the duplicate idempotency key, preventing the background logic from running twice.
