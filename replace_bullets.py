import os
import glob
import re

md_files = glob.glob("public/articles/*.md")

new_bullets = """* Action Center prioritizes who to contact based on age, risk, and broken promises
* Automated Late Fee calculation and billing
* Secure Client Portal for self-serve payments
* Client Groups to segment and apply different rules
* Smart Cooldowns to pause automations when you step in manually
* Send reminders from your own Gmail, not from a system address
* Draft follow-ups in three tones: friendly, firm, or final notice
* QuickBooks, Xero, and Stripe integrations"""

for filepath in md_files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # We'll use a regex to find the bulleted list starting with "* Send reminders from your own Gmail"
    # and continuing for several lines of bullets.
    pattern = re.compile(r"\* Send reminders from your own Gmail, not from Duely(?:\n\* .*?)+(?=\n\n|\n[^\*])")
    
    if pattern.search(content):
        new_content = pattern.sub(new_bullets, content)
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Replaced bullets in {filepath}")

