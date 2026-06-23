# Cron Jobs Documentation

Duely relies on several scheduled background tasks (cron jobs) to automate core business logic such as sending reminders, applying late fees, and synchronizing data with third-party accounting software. 

Since the infrastructure relies on an external provider (`cron-job.org`), this document outlines all the available endpoints, their purpose, their recommended execution schedule, and instructions on how to set them up.

## Available Cron Endpoints

All endpoints are relative to your base production URL (e.g., `https://duely.in`).

### 1. Send Reminders
*   **Endpoint:** `/api/cron/send-reminders`
*   **Method:** `GET`
*   **Recommended Schedule:** Hourly (`0 * * * *`)
*   **Description:** Scans the database for active clients and invoices that are due for a reminder. It handles the logic for both recurring reminders and sequence-based reminders, and dispatches the emails via the connected Gmail accounts.

### 2. Apply Late Fees
*   **Endpoint:** `/api/cron/apply-late-fees`
*   **Method:** `GET`
*   **Recommended Schedule:** Daily (e.g., Midnight `0 0 * * *`)
*   **Description:** Checks for overdue invoices past their configured grace period. Applies late fees based on user-defined policies (flat/percentage), updates the local balances, pushes new invoices to Xero, and emails the clients about the new fee.

### 3. Send Digests
*   **Endpoint:** `/api/cron/send-digest`
*   **Method:** `GET`
*   **Recommended Schedule:** Daily or Weekly (depending on user preference configured in the app)
*   **Description:** Compiles a summary report of account activities (reminders sent, payments collected, upcoming tasks) and sends it to the Duely account owner.

### 4. Sync Xero
*   **Endpoint:** `/api/cron/sync-xero`
*   **Method:** `GET`
*   **Recommended Schedule:** Every 1–6 hours depending on traffic and API rate limits.
*   **Description:** Pulls down the latest invoice states and payment information from connected Xero accounts, ensuring the Duely dashboard and reminder sequences are up-to-date.

### 5. Sync QuickBooks
*   **Endpoint:** `/api/cron/sync-quickbooks`
*   **Method:** `GET`
*   **Recommended Schedule:** Every 1–6 hours depending on traffic and API rate limits.
*   **Description:** Similar to the Xero sync, pulls the latest invoices and payment states from connected QuickBooks accounts.

---

## Configuration Guide for cron-job.org

To prevent unauthorized access, all cron endpoints require an explicit authorization header. To configure a new job in `cron-job.org`:

1.  **Create a New Cronjob:**
    *   **Title:** e.g., "Duely - Send Reminders"
    *   **URL:** `https://<YOUR_PRODUCTION_DOMAIN>/api/cron/<endpoint>` (e.g., `https://duely.in/api/cron/send-reminders`)
2.  **Schedule:**
    *   Select the appropriate execution frequency matching the recommended schedules above.
3.  **Advanced (HTTP / Request details):**
    *   **HTTP Method:** `GET`
    *   **HTTP Headers:** Add a new header to authenticate the request.
        *   **Header Name:** `Authorization`
        *   **Header Value:** `Bearer YOUR_CRON_SECRET`
        *(Replace `YOUR_CRON_SECRET` with the exact string defined under `CRON_SECRET` in your `.env.local` / production environment variables).*
4.  **Save** the job. You can use the "Test run" feature in `cron-job.org` to verify that the endpoint returns a `200 OK` status and executes correctly.
