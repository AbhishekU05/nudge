import re

def fix_events(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    # Add clients and invoices to events mapping
    content = re.sub(
        r'(note:\s*e\.description\s*\|\|\s*null,?)(\s*\})',
        r'\1\n        clients: e.clients,\n        invoices: e.invoices\2',
        content
    )
    # Add clients and invoices to payments mapping (which usually ends with note: null or currency: p.currency)
    if "activity/page.tsx" in filepath or "invoices/page.tsx" in filepath or "customers/page.tsx" in filepath:
        content = re.sub(
            r'(note:\s*null,?)(\s*\})',
            r'\1\n        clients: p.invoices?.clients,\n        invoices: p.invoices\2',
            content
        )
    elif "analytics/page.tsx" in filepath:
        # analytics has currency: p.currency as last field for mappedEvents
        content = re.sub(
            r'(currency:\s*p\.currency)(\s*\})',
            r'\1,\n      clients: p.invoices?.clients,\n      invoices: p.invoices\2',
            content
        )
        # also for events in analytics
        content = re.sub(
            r'(currency:\s*null)(\s*\})',
            r'\1,\n      clients: e.clients,\n      invoices: e.invoices\2',
            content
        )
        
    with open(filepath, "w") as f:
        f.write(content)
    print(f"Fixed {filepath}")

fix_events("app/(app)/invoices/page.tsx")
fix_events("app/(app)/customers/page.tsx")
fix_events("app/(app)/analytics/page.tsx")
fix_events("app/(app)/activity/page.tsx")

