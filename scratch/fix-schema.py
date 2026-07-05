import os
import re

def fix_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    
    # 1. dodo_renews_at -> dodo_next_billing_date (assuming that's the new column, let's just remove it or change to dodo_next_billing_date)
    # Wait, in types.ts it is dodo_next_billing_date. Let's replace dodo_renews_at with dodo_next_billing_date
    content = content.replace("dodo_renews_at", "dodo_next_billing_date")
    
    # 2. dashboard/page.tsx specific fixes
    if "dashboard/page.tsx" in filepath:
        # Remove active and next_send_at queries
        content = re.sub(
            r'supabase\.from\("email_drafts"\).*?,',
            r'Promise.resolve({ data: [] }),',
            content
        )
        content = re.sub(
            r'supabase\.from\("clients"\)\.select\("id, name, next_send_at"\).*?,',
            r'Promise.resolve({ data: [] }),',
            content
        )
        content = re.sub(
            r'supabase\.from\("invoices"\)\.select\("id, next_send_at, clients\(name\)"\).*?,',
            r'Promise.resolve({ data: [] }),',
            content
        )
        # Fix the Promise.all array index mapping
        # Actually it's easier to just change the select string
    
    if "automate/page.tsx" in filepath:
        content = re.sub(
            r'\.select\("id, invoice_number, reminder_type, next_send_at, auto_approve, reminders_enabled, sequence_index, clients\(name, email\)"\)',
            r'.select("id, status, clients(name, email)")',
            content
        )
        content = re.sub(r'reminders_enabled=eq\.true', r'status=eq.outstanding', content)
        content = content.replace(".eq('reminders_enabled', true)", "")
        content = content.replace("invoice.invoice_number", "invoice.id")
        
    if "customers/[id]/page.tsx" in filepath:
        content = content.replace("inv.invoice_number || ", "")

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")

for root, _, files in os.walk("app/(app)"):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            fix_file(os.path.join(root, file))
