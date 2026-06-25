import os
import glob
import re

md_files = glob.glob("public/articles/*.md")

old_pattern = re.compile(r"\[Duely\]\(https://duely\.in\).*?payment link included\.", re.DOTALL)
new_text = "[Duely](https://duely.in) is an intelligent collections engine built specifically for owner-led agencies and freelancers. After sending an invoice, Duely's Action Center prioritizes exactly who to chase based on invoice age and risk. It features Automated Late Fees, a dedicated Client Portal for self-serve payments, Client Groups for segmentation, and Smart Cooldowns that prevent automated reminders if you've recently contacted a client manually. It also integrates seamlessly with your Gmail to send personalized payment reminders directly from your own outbox."

for filepath in md_files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    if old_pattern.search(content):
        new_content = old_pattern.sub(new_text, content)
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated What is Duely in {filepath}")

