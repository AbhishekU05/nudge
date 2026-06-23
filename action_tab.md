# Duely "Action Center" Logic & Philosophy

*This document defines the core workflow and deterministic logic of Duely's Action Center. This is the heart of the application, the primary differentiator from competitors like Paidnice, and the core value proposition for users.*

## 1. Core Philosophy: The Inbox Zero of Accounts Receivable
Paidnice gives users a dashboard of late invoices. Duely gives users a **Daily To-Do List**. 
The goal of the Action tab is cognitive offloading: the user opens Duely at 9:00 AM, sees a curated, prioritized list of exactly who to email, what tone to use, and why. Once the list is cleared, they close the app knowing their AR is perfectly handled.

---

## 2. The Deterministic Priority Engine (0-100 Score)
We use a rigid, point-based **"Urgency Score" (0-100)** calculated dynamically for each customer. No AI guesswork, just math based on database facts. 

*(Note: If the sum of the points exceeds 100, the final score is strictly capped at 100 `Math.min(score, 100)` so category thresholds never break).*

### A. Base Score: Invoice Aging (Max 50 points)
*Time is the biggest factor, so it makes up half the potential score.*
- **1-3 days overdue:** 10 points
- **4-14 days overdue:** 25 points
- **15-30 days overdue:** 40 points
- **31+ days overdue:** 50 points

### B. Financial Risk Weighting (Max 30 points)
*Since we don't track total business revenue, we base this on the **Total Outstanding Balance** of the user. A high-value invoice relative to their total AR pushes urgency up much faster.*
- **< 5% of Total AR:** 0 points
- **5-15% of Total AR:** 15 points
- **> 15% of Total AR:** 30 points

### C. Historical Behavior Modifier (-10 to +20 points)
*Are we dealing with a forgetful friend or a chronic problem?*
- **Good Payer (Average Days Overdue < 3):** -10 points (Benefit of the doubt)
- **Normal Payer (Average Days Overdue 3-14):** 0 points
- **Chronic Late Payer (Average Days Overdue > 14):** +20 points (Accelerate escalation)

### D. The Broken Promise Trigger (+50 points)
If a user logged a "Payment Promise Date" in the CRM and that date passes without payment, this triggers an immediate **+50 point penalty**. A broken promise on even a minor invoice instantly makes it a serious issue.

---

## 3. The Overrides: Cooldowns & Automations
We heavily modify the score based on recent actions to prevent the user from nagging clients or doing double-work.

### Override 1: The "Auto-Pilot" Suppression
If a client is currently enrolled in an active automation sequence (e.g., standard 3-email sequence):
- **Action:** Their score is completely suppressed. They are removed from the manual to-do list.
- **Exceptions (When they bounce back to Manual):** 
  - *Trigger A:* The automation sequence finishes but the invoice is still unpaid. (Score rockets to Critical).
  - *Trigger B:* The client replies to the automated email. (Score rockets to Critical: "Client Replied - Manual Action Needed").

### Override 2: The Cooldown Multiplier (Dynamic Snooze)
If a manual follow-up was just sent, we apply a massive negative score (-100 points) to remove them from the daily queue. The cooldown length scales with severity:
- **1-10 days late:** 5-day cooldown. (Follow up weekly).
- **11-30 days late:** 3-day cooldown. (Follow up twice a week).
- **31+ days late:** 1-day cooldown. (Follow up daily).

---

## 4. The Action Categories (The UI View)
When the user opens the tab, tasks are divided into clear buckets based on the final Urgency Score:

### 🔴 Critical Manual Actions (Score 70+)
*What it means:* Automation exhausted, a broken promise, or severely aged debt. 
*Suggested Action:* "Firm Follow-up", "Reply to Client", or "Pause Services Warning".
*UI Element:* Red borders, bold typography, positioned at the very top.

### 🟡 Moderate Nudges (Score 35-69)
*What it means:* Standard overdue invoices. No broken promises, but getting stale.
*Suggested Action:* "Friendly Check-in" or "Reminder to Accounting Dept".
*UI Element:* Yellow/Orange borders, standard priority.

### 🟢 Chill Follow-ups (Score < 35)
*What it means:* Invoice is only 1-3 days late, or it's a historically great client who probably just forgot.
*Suggested Action:* "Light Nudge" or "Wait 2 more days".
*UI Element:* Green/Grey borders, low priority.

### ⚙️ System & Workflow Recommendations (Special Actions)
*What it means:* The system looks for patterns in manual labor to suggest tailored automation. The exact copy adapts to the specific history.

* **Pattern A: The "One-and-Done" Client**
  * *Trigger:* User manually sends a single follow-up, and the client pays within 48 hours every month.
  * *Action Tab Copy:* *"Stark Industries consistently pays right after your first nudge. Want to automate just a single 'Gentle Nudge' on Day 3 so you don't have to do it manually anymore?"*
* **Pattern B: The "Chronic Chaser" Client**
  * *Trigger:* It takes 3+ manual follow-ups to get paid over the last two invoices.
  * *Action Tab Copy:* *"Wayne Enterprises is requiring a lot of manual chasing. Click here to enroll them in a strict 4-step escalation sequence."*
* **Pattern C: The Global Minor Offender**
  * *Trigger:* 5+ clients all sitting in the 1-3 days late bucket.
  * *Action Tab Copy:* *"You have 5 clients mildly overdue right now. Turn on 'Global Gentle Reminders' to handle these early nudges for you."*
*UI Element:* Purple/Blue borders, distinguished from specific invoice tasks.

---

## 5. The User Workflow (The "Daily Clear")

1. **The Morning Brief:** User clicks the `Action` tab. The page states: *"You have 4 manual actions to take today."* (Below it, a small note says: *"Robots at work: 6 automated follow-ups going out today"*).
2. **Reviewing a Task:** User clicks the first action card (e.g., *Client: Acme Corp | $4,500 | 18 Days Late*).
3. **The Context Panel:** The card expands to show deterministic context:
   - "Acme Corp is 18 days late. Automation sequence finished yesterday with no response."
4. **Taking Action (One-Click Resolutions):**
   - **Button A:** Send "Firm Nudge" (Opens email draft)
   - **Button B:** Log new Payment Promise (Snoozes the action)
   - **Button C:** Snooze 3 days manually
5. **Completion (The "Look Ahead"):** Once the daily queue is cleared, the page doesn't just show a generic success graphic. It shows a subtle preview of what's coming next: *"Inbox Zero for today. Next up: Stark Industries comes off cooldown tomorrow, and Acme Corp's promise date is on Thursday."* This creates a continuous, predictable loop for the user.

---

## 6. Technical Architecture (Avoiding Spaghetti Code)
To prevent this deterministic logic from turning into 5,000 lines of nested `if/else` statements, this must be built using a **Rules Engine** or **Scoring Pipeline** pattern.
- **The Scoring Pipeline:** Instead of hardcoding conditions, we pass the customer object through an array of isolated `Scorer` functions (e.g., `calculateAgingScore(invoice)`, `calculateFinancialRisk(invoice, totalAR)`). Each function independently returns a number. The final score is just the sum.
- **The Recommendation Engine:** For the dynamic copy variants, we use a simple list of `RecommendationRule` objects. Each rule has an `evaluate(history)` function. The system loops through the rules and fires the first one that evaluates to true. This keeps adding new behaviors as easy as adding a 10-line file, without touching the core logic.

---

## 7. Critical Edge Cases & State Handling
To ensure the math never breaks in the real world, the engine must account for these edge cases:

* **Multiple Overdue Invoices for One Client:** We do not create separate tasks per invoice. We create *one task per client*. The engine evaluates the client based on the **oldest** active invoice for Aging, and the **sum** of all their overdue invoices for Financial Risk.
* **Partially Paid Invoices:** The Financial Risk score must strictly calculate using the *remaining balance*, not the original invoice total.
* **Disputes / Paused Invoices:** If the user flags an invoice as "Disputed" (e.g., arguing over scope), it acts as an infinite cooldown. It drops out of the Action Tab entirely until the flag is removed.
* **The "Client Replied" Override:** Even if a client is on a 5-day cooldown from a recent manual nudge, if the system detects an incoming reply from them, the cooldown is instantly shattered and the client rockets to the top of the Critical list (*"Client replied. Your turn."*).
* **Credit Notes / Negative Balances:** Any invoice with an outstanding balance of `<= $0` is immediately filtered out of the pipeline before scoring begins.
* **The "First Run" Empty State Problem:** When a new user connects QuickBooks, if their worst invoice is only 2 days late, the Action Tab will technically have no Critical tasks. To prevent them from thinking the app is broken, we trigger a special Onboarding State: *"We've analyzed your accounting data. Good news! You have no fires to put out today. You have 3 invoices mildly overdue—sit tight, and we'll alert you if they hit the warning threshold."*
