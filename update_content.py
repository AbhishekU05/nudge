import os
import glob
import re

articles_dir = "public/articles"
seo_data_file = "lib/seo-data.ts"

# 1. Update Markdown files in public/articles
md_files = glob.glob(os.path.join(articles_dir, "*.md"))

old_string_1 = "The only tool focused exclusively on what happens after you send the invoice — follow-up tracking, payment promise logging, partial payment management, and Gmail-connected automated reminders."
new_string_1 = "The only tool focused exclusively on what happens after you send the invoice. Duely features an intelligent Action Center that analyzes aging and broken promises to generate a daily prioritized queue of who to contact. It also includes Automated Late Fees, a dedicated Client Portal for self-serve payments, Client Groups for segmentation, and Smart Cooldowns that prevent automated reminders if you've recently contacted a client manually."

old_string_2 = "* Send reminders from your own Gmail, not from Duely\n* Track partial payments and payment promises\n* Log notes and manual follow-ups on a timeline"
new_string_2 = "* Prioritize who to chase with the intelligent Action Center\n* Automate Late Fee calculations and billing\n* Provide clients a secure portal to view and pay invoices\n* Use Smart Cooldowns to avoid spamming clients after manual contact"

for filepath in md_files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    modified = False
    if old_string_1 in content:
        content = content.replace(old_string_1, new_string_1)
        modified = True
    
    if old_string_2 in content:
        content = content.replace(old_string_2, new_string_2)
        modified = True
        
    # Replace any mention of "Duely only does basic tracking" or similar if they exist
    if "Duely is purposely not a full CRM" in content:
        content = content.replace("Duely is purposely not a full CRM", "While Duely is not a full CRM, it is a highly intelligent collections engine")
        modified = True
        
    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

# 2. Update lib/seo-data.ts
with open(seo_data_file, 'r') as f:
    seo_content = f.read()

# Replace features in seo-data.ts to highlight the new ones
seo_content = re.sub(
    r'"Tracks explicit payment promises with dates and client timelines"',
    r'"Intelligent Action Center prioritizes your daily follow-ups",\n      "Automated Late Fees and Smart Cooldowns prevent awkward conversations"',
    seo_content
)

seo_content = re.sub(
    r'"Automatically logs when a client promises to pay"',
    r'"Client Portal lets customers self-serve payments without email ping-pong"',
    seo_content
)

seo_content = re.sub(
    r'"Clear timelines showing exactly when you followed up"',
    r'"Smart Cooldowns pause automations when you step in manually"',
    seo_content
)

seo_content = re.sub(
    r'"Tracks exactly how many days a client is overdue"',
    r'"Client Groups let you apply different late fees and rules to VIPs"',
    seo_content
)

seo_content = re.sub(
    r'"Dedicated tracking for \'Promise to Pay\' dates"',
    r'"Action Center scores and prioritizes invoices by risk"',
    seo_content
)

with open(seo_data_file, 'w') as f:
    f.write(seo_content)

print(f"Updated {seo_data_file}")
