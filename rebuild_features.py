import re

def get_block(text, start_marker, end_marker=None):
    if end_marker:
        pattern = re.compile(rf"({re.escape(start_marker)}.*?){re.escape(end_marker)}", re.DOTALL)
        match = pattern.search(text)
        if match:
            return match.group(1)
    else:
        # Assuming each block starts with {/* Section or {/* [0-9] and ends before the next Container or section
        pattern = re.compile(rf"({re.escape(start_marker)}.*?)(?=\{{/\* |</section>)", re.DOTALL)
        match = pattern.search(text)
        if match:
            return match.group(1).strip()
    return ""

with open("app/page.tsx", "r") as f:
    page_text = f.read()

with open("app/features/page.tsx", "r") as f:
    feat_text = f.read()

# Extract features from app/features/page.tsx
feat_promise = get_block(feat_text, "{/* Section 1: Promise Tracking */}")
feat_tone = get_block(feat_text, "{/* Section 2: Follow-up drafting by tone */}")
feat_partial = get_block(feat_text, "{/* Section 3: Partial payments */}")
feat_reminders = get_block(feat_text, "{/* Section 4: Automated reminders */}")
feat_gmail = get_block(feat_text, "{/* Section 5: Reminders from your own email */}")
feat_log = get_block(feat_text, "{/* Section 6: Follow-up logging and timeline */}")
feat_history = get_block(feat_text, "{/* Section 7: Full client history */}")
feat_accounting = get_block(feat_text, "{/* Section 8: QuickBooks and Xero */}")
feat_analytics = get_block(feat_text, "{/* Section 9: Analytics */}")
feat_csv = get_block(feat_text, "{/* Section 10: CSV export */}")
feat_weekly = get_block(feat_text, "{/* Section 11: Weekly Digest Email */}")

# Extract features from app/page.tsx
page_action = get_block(page_text, "{/* 1. Action Center */}")
page_portal = get_block(page_text, "{/* 4. Client Portal */}")

# Extract Bento boxes from app/page.tsx
bento_late = get_block(page_text, "{/* Late Fees */}")
bento_cooldown = get_block(page_text, "{/* Cooldowns */}")
bento_segment = get_block(page_text, "{/* Client Groups */}")
# Fix bento_segment ending since it might bleed into Accounting Sync in the Bento Grid
bento_segment = bento_segment.split("{/* Stripe Sync */}")[0].strip()
bento_segment = bento_segment.split("{/* Accounting Sync */}")[0].strip()

# Change Late fees to not have lg:col-span-2 so it fits in a 3 col grid nicely
bento_late = bento_late.replace("lg:col-span-2", "")

# Build the new workflow sections in order of impact and need:
# 1. Accounting
# 2. Gmail
# 3. Action Center
# 4. Weekly Digest
# 5. Client Portal
# 6. Automated Reminders
# 7. Promise Tracking
# 8. Partial payments
# 9. Tone Drafting
# 10. Follow-up logging
# 11. Full client history
# 12. Analytics
# 13. CSV Export

workflow_blocks = [
    feat_accounting,
    feat_gmail,
    page_action,
    feat_weekly,
    page_portal,
    feat_reminders,
    feat_promise,
    feat_partial,
    feat_tone,
    feat_log,
    feat_history,
    feat_analytics,
    feat_csv
]

workflow_html = "\n\n".join(workflow_blocks)

bento_grid = f"""
          {{/* Additional Features */}}
          <Container>
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-50">
                And everything else you need.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bento_late}
              {bento_cooldown}
              {bento_segment}
            </div>
          </Container>
"""

# Extract top and bottom parts of app/features/page.tsx
top_part = feat_text.split("{/* WORKFLOW SECTIONS */}")[0]
bottom_part = feat_text.split("{/* WORKS WITH */}")[1]

# Fix imports in top_part
if "Mail" not in top_part:
    top_part = top_part.replace(
        "  User\n} from \"lucide-react\";",
        "  User,\n  Mail,\n  Users,\n  Activity,\n  AlertTriangle\n} from \"lucide-react\";"
    )

new_content = top_part + "{/* WORKFLOW SECTIONS */}\n        <section className=\"relative overflow-hidden py-24 sm:py-32 space-y-32 sm:space-y-40 bg-zinc-950/50 border-y border-white/5 backdrop-blur-sm\">\n\n" + workflow_html + "\n\n" + bento_grid + "\n        </section>\n\n        {/* WORKS WITH */}" + bottom_part

with open("app/features/page.tsx", "w") as f:
    f.write(new_content)

print("Rewrite successful")
