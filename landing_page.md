# Landing Page Gap Analysis

The landing page currently highlights many of the core features of Duely, but it completely misses several of the major capabilities we've built over the past week. It still positions the product primarily as a basic tracking and manual follow-up tool, rather than an intelligent, automated collections engine.

## What IS currently on the landing page
1. **Promise Tracking:** Logging when a client promises to pay and any notes.
2. **Follow-up Drafting:** Picking a tone (Friendly, Professional, Firm) to generate an email.
3. **Partial Payments:** Logging and tracking partial payments with a progress bar.
4. **Automated Reminders (Basic):** Mentioning that Duely can send reminders on a schedule.
5. **Gmail Integration:** Sending emails from the user's own connected Gmail address.
6. **Activity Logging:** Keeping a timeline of calls, emails, and WhatsApp messages.
7. **Client History:** The consolidated chronological timeline of a client's history.
8. **Integrations:** Mentioning QuickBooks, Xero, and Stripe.
9. **CSV Export:** Being able to export the collections pipeline.

## What is MISSING (Recently Added Features)
These are powerful new features that need to be showcased to justify the value of the platform:

1. **The Action Center (Intelligent Prioritization)**
   - **What it is:** The "Inbox Zero" for collections. A deterministic scoring engine that analyzes aging, financial risk, and broken promises to generate a daily prioritized queue of who to contact.
   - **Why it matters:** Users don't have to guess who to chase. The system tells them exactly what to do (e.g., "Critical: Send a firm follow-up. Client broke a payment promise").

2. **Late Fee Automation**
   - **What it is:** The ability to configure automated late fee policies (flat rate or percentage), with grace periods and recurring frequencies (once, weekly, monthly).
   - **Why it matters:** Late fees are a huge pain to calculate and apply manually. Duely automating this is a massive value prop for agencies.

3. **Client Groups & Segmentation**
   - **What it is:** Organizing clients into distinct groups with custom tags/colors to manage them better and apply specific policies (like excluding certain VIP clients from late fees or automations).
   - **Why it matters:** Not all clients are treated equally. Groups allow for targeted collections strategies.

4. **The Client Portal**
   - **What it is:** A secure, public-facing portal where clients can view their outstanding invoices, see their history, and (soon) make payments.
   - **Why it matters:** Professionalism. It gives the debtor a self-serve way to resolve their balance without back-and-forth emails.

5. **Advanced Workflow Rules (Cooldowns)**
   - **What it is:** The engine's built-in cooldowns that prevent spamming clients if they were recently contacted manually.
   - **Why it matters:** Emphasizes the "relationship-preserving" angle of Duely. It's smart enough to step back when a human steps in.

## Next Steps
We should redesign the landing page structure to group these features into larger "Value Pillars":
1. **Intelligent Triage:** Action Center, Scoring, Smart Cooldowns.
2. **Automation & Enforcement:** Late Fees, Automated Reminders.
3. **Relationship Management:** Gmail Integration, Tone Drafting, Client History, Groups.
4. **Professional Experience:** Client Portal, Seamless Stripe/Accounting Sync.

### Navigation Restructuring
In addition to adding the missing features, we need to completely overhaul the site navigation to make it feel like a mature SaaS product:
- **Top Header:** Add clear links for `How it works`, `Features`, `Pricing`, and `About` so users can jump straight to what they need. To ensure no pages are orphaned, we will move `/tools`, `/articles`, and `/faq` into the footer or a "Resources" dropdown in the header.
- **Bottom Footer:** Organize the chaotic footer links into structured columns (e.g., Product, Use Cases, Compare, Company) instead of leaving them hazardously spread out.
- **Link Preservation Guarantee:** *Every single page* that is currently accessible from the landing page (`/tools`, SEO pages like `/for-agencies`, `/for/marketing-agencies`, integrations, terms, privacy) must be explicitly mapped into the new footer grid. Nothing will be dropped or hidden.

### UI Presentation (Mockups)
A core strength of the current landing page is that it uses HTML/CSS components that look *exactly* like the real app's UI, rather than abstract graphics. 
- When building the new sections (Action Center, Late Fees, Client Portal, etc.), we must **replicate the real app UI elements** within the landing page's cards. 
- E.g., The Action Center section should show a literal mocked `ActionCard` with a red "Critical" badge and a "Send Firm Nudge" button, just like the real dashboard.

### Copywriting & Emotional Hooks
The current landing page succeeds because it leads with intense, relatable pain points before introducing the feature. We must maintain this exact pattern for the new sections:

#### 1. Action Center
- **Emotional Headline:** You log in to 14 overdue invoices. Which one is actually a fire?
- **Paragraph:** Stop guessing who to chase. The Action Center analyzes aging, financial risk, and broken promises to tell you exactly who needs a nudge today, and who can wait.
- **UI Mockup:** An `ActionCard` showing a red "Critical" badge for a broken promise and a prominent "Send Firm Nudge" button.

#### 2. Late Fees
- **Emotional Headline:** You hate charging late fees. But you hate being treated like a free bank even more.
- **Paragraph:** Configure a flat or percentage late fee policy once. Duely automatically applies it to chronically late invoices—so you can blame the system instead of having an awkward conversation.
- **UI Mockup:** A settings toggle card showing an active policy: "5% monthly fee, applied after 14-day grace period."

#### 3. Smart Cooldowns (Relationship Management)
- **Emotional Headline:** You just called them yesterday. You don't want a robot emailing them today.
- **Paragraph:** Duely knows when you've stepped in. If you log a manual call or text, the automated engine instantly backs off so you never sound out of touch.
- **UI Mockup:** A timeline showing a manual call logged, followed by a system status badge: "Automated sequence paused (Cooldown active)."

#### 4. Client Groups
- **Emotional Headline:** You can't treat your 5-year VIP client the same as the guy who just disappeared.
- **Paragraph:** Organize clients into distinct groups with custom tags. Turn off automated reminders for your best accounts, and escalate the ones who need a tighter leash.
- **UI Mockup:** A customer row showing a "VIP" badge alongside an "Automations Disabled" toggle.

#### 5. Client Portal
- **Emotional Headline:** They keep asking you to resend the invoice. Then they ask for the payment link.
- **Paragraph:** Give your clients a secure, branded portal where they can view their complete billing history, download past invoices, and pay directly. No more email ping-pong.
- **UI Mockup:** A clean, unbranded dashboard view from the client's perspective showing an outstanding balance and a "Pay Now" button.

### Page Architecture & Layout Re-org
Right now, the landing page stacks features vertically. If we add 5 new features, we will have an exhausting 15-section scroll. We need to restructure the page architecture:

1. **The Hero Section:** Keep the punchy headline, but update the floating UI mockup to showcase the new **Action Center**.
   - **Crucial UI Detail:** The Action Center mockup here must show the "real shit"—high stakes, emotional tasks that demonstrate the full capability of the engine. It shouldn't just be a "3 days late" chill reminder. It needs to show a **Critical** task for a broken payment promise on a $15k invoice, alongside a **System** task recommending turning on global automation. It must be an exact visual replica of the real `ActionCard` component.
2. **The "Core Four" (Homepage):** Instead of 15 full sections, the homepage scroll will only highlight the four most powerful, emotionally resonant features:
   - The Action Center (Intelligent Triage)
   - Follow-up Tone Drafting (Message drafting)
   - Gmail Integration (Preserving relationships)
   - Client Portal (Professionalism)
3. **The Bento Box Grid (Homepage):** Further down the homepage, we consolidate the remaining features (Late Fees, Stripe Sync, Partial Payments, Groups, CSV Export) into a compact, visually appealing "bento box" grid. This allows users to see the breadth of the platform without an endless scroll.
4. **Dedicated `/features` Page:** We move the deep dive of *all 15 features* to a dedicated `/features` page, which users can navigate to via the new Top Header.
5. **Specialized Landing Pages:** All persona-specific pages (`/for-freelancers`, `/for-agencies`, `/for-consultants`, etc.) must adopt this exact same new architecture (Hero Action Center, Core Four, Bento Box). However, the emotional copywriting and mockups on those pages must be tailored specifically to that audience (e.g., using "agency owner" pain points vs "freelancer" pain points).
