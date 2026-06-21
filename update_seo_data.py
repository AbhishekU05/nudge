import re
import json

with open('lib/seo-data.ts', 'r') as f:
    content = f.read()

# Make sure we add relatedLinks to the type
content = content.replace("cta: string;", "cta: string;\n  relatedLinks?: { href: string; label: string }[];")

mapping = {
    "paidnice": [
        {"href": "/for/marketing-agencies", "label": "Duely for Marketing Agencies"},
        {"href": "/for/web-design-agencies", "label": "Duely for Web Design Agencies"},
        {"href": "/use-case/automate-invoice-reminders", "label": "Automate Invoice Reminders"}
    ],
    "chaser": [
        {"href": "/for/marketing-agencies", "label": "Duely for Marketing Agencies"},
        {"href": "/for/pr-agencies", "label": "Duely for PR Agencies"},
        {"href": "/integrations/xero", "label": "Xero Invoice Reminders"}
    ],
    "invoiced": [
        {"href": "/for/creative-agencies", "label": "Duely for Creative Agencies"},
        {"href": "/for/web-design-agencies", "label": "Duely for Web Design Agencies"},
        {"href": "/integrations/quickbooks", "label": "QuickBooks Sync"}
    ],
    "upflow": [
        {"href": "/for/video-production-agencies", "label": "Duely for Video Production"},
        {"href": "/for/marketing-agencies", "label": "Duely for Marketing Agencies"},
        {"href": "/integrations/stripe", "label": "Stripe Integration"}
    ],
    "bill": [
        {"href": "/for/consultants", "label": "Duely for Consultants"},
        {"href": "/for/freelance-designers", "label": "Duely for Freelance Designers"},
        {"href": "/use-case/reduce-late-payments", "label": "Reduce Late Payments"}
    ],
    "freshbooks": [
        {"href": "/for/freelance-designers", "label": "Duely for Freelance Designers"},
        {"href": "/for/copywriters", "label": "Duely for Copywriters"},
        {"href": "/integrations/quickbooks", "label": "QuickBooks Reminders"}
    ],
    "honeybook": [
        {"href": "/for/consultants", "label": "Duely for Consultants"},
        {"href": "/for/freelance-designers", "label": "Duely for Freelance Designers"},
        {"href": "/use-case/get-freelance-invoices-paid-faster", "label": "Get Freelance Invoices Paid Faster"}
    ],
    "xero-reminders": [
        {"href": "/for/marketing-agencies", "label": "Duely for Marketing Agencies"},
        {"href": "/for/creative-agencies", "label": "Duely for Creative Agencies"},
        {"href": "/alternatives/duely-vs-chaser", "label": "Duely vs Chaser"}
    ],
    "quickbooks-reminders": [
        {"href": "/for/web-design-agencies", "label": "Duely for Web Design Agencies"},
        {"href": "/for/pr-agencies", "label": "Duely for PR Agencies"},
        {"href": "/alternatives/duely-vs-paidnice", "label": "Duely vs Paidnice"}
    ],
    
    # Industries
    "marketing-agencies": [
        {"href": "/integrations/quickbooks", "label": "QuickBooks Integration"},
        {"href": "/integrations/xero", "label": "Xero Integration"},
        {"href": "/use-case/automate-invoice-reminders", "label": "Automate Invoice Reminders"}
    ],
    "web-design-agencies": [
        {"href": "/integrations/quickbooks", "label": "QuickBooks Integration"},
        {"href": "/integrations/stripe", "label": "Stripe Integration"},
        {"href": "/use-case/follow-up-overdue-invoices", "label": "Follow Up Overdue Invoices"}
    ],
    "content-agencies": [
        {"href": "/integrations/xero", "label": "Xero Integration"},
        {"href": "/integrations/stripe", "label": "Stripe Integration"},
        {"href": "/use-case/reduce-late-payments", "label": "Reduce Late Payments"}
    ],
    "video-production-agencies": [
        {"href": "/integrations/quickbooks", "label": "QuickBooks Integration"},
        {"href": "/integrations/xero", "label": "Xero Integration"},
        {"href": "/use-case/reduce-late-payments", "label": "Reduce Late Payments"}
    ],
    "pr-agencies": [
        {"href": "/integrations/xero", "label": "Xero Integration"},
        {"href": "/alternatives/duely-vs-upflow", "label": "Duely vs Upflow"},
        {"href": "/use-case/automate-invoice-reminders", "label": "Automate Invoice Reminders"}
    ],
    "consultants": [
        {"href": "/integrations/quickbooks", "label": "QuickBooks Integration"},
        {"href": "/integrations/freshbooks", "label": "FreshBooks Integration"},
        {"href": "/alternatives/duely-vs-honeybook", "label": "Duely vs HoneyBook"}
    ],
    "freelance-designers": [
        {"href": "/integrations/xero", "label": "Xero Integration"},
        {"href": "/use-case/get-freelance-invoices-paid-faster", "label": "Get Freelance Invoices Paid Faster"},
        {"href": "/alternatives/duely-vs-honeybook", "label": "Duely vs HoneyBook"}
    ],
    "copywriters": [
        {"href": "/integrations/quickbooks", "label": "QuickBooks Integration"},
        {"href": "/use-case/get-freelance-invoices-paid-faster", "label": "Get Freelance Invoices Paid Faster"},
        {"href": "/alternatives/duely-vs-freshbooks", "label": "Duely vs FreshBooks"}
    ],
    "creative-agencies": [
        {"href": "/integrations/xero", "label": "Xero Integration"},
        {"href": "/integrations/stripe", "label": "Stripe Integration"},
        {"href": "/use-case/invoice-collections-automation", "label": "Invoice Collections Automation"}
    ],

    # Integrations
    "quickbooks": [
        {"href": "/alternatives/duely-vs-paidnice", "label": "Duely vs Paidnice"},
        {"href": "/alternatives/duely-vs-invoiced", "label": "Duely vs Invoiced"},
        {"href": "/for/consultants", "label": "Duely for Consultants"},
        {"href": "/for/freelance-designers", "label": "Duely for Freelance Designers"}
    ],
    "xero": [
        {"href": "/alternatives/duely-vs-chaser", "label": "Duely vs Chaser"},
        {"href": "/alternatives/duely-vs-paidnice", "label": "Duely vs Paidnice"},
        {"href": "/for/marketing-agencies", "label": "Duely for Marketing Agencies"},
        {"href": "/for/web-design-agencies", "label": "Duely for Web Design Agencies"}
    ],
    "freshbooks": [
        {"href": "/alternatives/duely-vs-freshbooks", "label": "Duely vs FreshBooks Reminders"},
        {"href": "/for/consultants", "label": "Duely for Consultants"},
        {"href": "/for/freelance-designers", "label": "Duely for Freelance Designers"}
    ],
    "stripe": [
        {"href": "/alternatives/duely-vs-upflow", "label": "Duely vs Upflow"},
        {"href": "/for/web-design-agencies", "label": "Duely for Web Design Agencies"},
        {"href": "/for/creative-agencies", "label": "Duely for Creative Agencies"}
    ],

    # Locations
    "us": [
        {"href": "/for/marketing-agencies", "label": "Duely for Marketing Agencies"},
        {"href": "/for/web-design-agencies", "label": "Duely for Web Design Agencies"},
        {"href": "/integrations/quickbooks", "label": "QuickBooks Invoice Reminders"}
    ],
    "uk": [
        {"href": "/for/pr-agencies", "label": "Duely for PR Agencies"},
        {"href": "/for/creative-agencies", "label": "Duely for Creative Agencies"},
        {"href": "/integrations/xero", "label": "Xero Invoice Reminders"}
    ],
    "canada": [
        {"href": "/for/content-agencies", "label": "Duely for Content Agencies"},
        {"href": "/for/video-production-agencies", "label": "Duely for Video Production"},
        {"href": "/integrations/quickbooks", "label": "QuickBooks Invoice Reminders"}
    ],
    "australia": [
        {"href": "/for/freelance-designers", "label": "Duely for Freelance Designers"},
        {"href": "/for/consultants", "label": "Duely for Consultants"},
        {"href": "/integrations/xero", "label": "Xero Invoice Reminders"}
    ],
    "london": [
        {"href": "/for/pr-agencies", "label": "Duely for PR Agencies"},
        {"href": "/for/creative-agencies", "label": "Duely for Creative Agencies"},
        {"href": "/integrations/xero", "label": "Xero Invoice Reminders"}
    ],
    "new-york": [
        {"href": "/for/marketing-agencies", "label": "Duely for Marketing Agencies"},
        {"href": "/for/web-design-agencies", "label": "Duely for Web Design Agencies"},
        {"href": "/integrations/quickbooks", "label": "QuickBooks Invoice Reminders"}
    ],
    "sydney": [
        {"href": "/for/freelance-designers", "label": "Duely for Freelance Designers"},
        {"href": "/for/consultants", "label": "Duely for Consultants"},
        {"href": "/integrations/xero", "label": "Xero Invoice Reminders"}
    ],
    "toronto": [
        {"href": "/for/content-agencies", "label": "Duely for Content Agencies"},
        {"href": "/for/video-production-agencies", "label": "Duely for Video Production"},
        {"href": "/integrations/quickbooks", "label": "QuickBooks Invoice Reminders"}
    ],
    "melbourne": [
        {"href": "/for/freelance-designers", "label": "Duely for Freelance Designers"},
        {"href": "/for/creative-agencies", "label": "Duely for Creative Agencies"},
        {"href": "/integrations/xero", "label": "Xero Invoice Reminders"}
    ],

    # Use Cases
    "automate-invoice-reminders": [
        {"href": "/integrations/quickbooks", "label": "QuickBooks Integration"},
        {"href": "/integrations/xero", "label": "Xero Integration"},
        {"href": "/for/marketing-agencies", "label": "Duely for Marketing Agencies"}
    ],
    "follow-up-overdue-invoices": [
        {"href": "/integrations/xero", "label": "Xero Integration"},
        {"href": "/for/creative-agencies", "label": "Duely for Creative Agencies"},
        {"href": "/for/web-design-agencies", "label": "Duely for Web Design Agencies"}
    ],
    "get-freelance-invoices-paid-faster": [
        {"href": "/for/freelance-designers", "label": "Duely for Freelance Designers"},
        {"href": "/for/copywriters", "label": "Duely for Copywriters"},
        {"href": "/for/consultants", "label": "Duely for Consultants"}
    ],
    "reduce-late-payments": [
        {"href": "/for/marketing-agencies", "label": "Duely for Marketing Agencies"},
        {"href": "/for/pr-agencies", "label": "Duely for PR Agencies"},
        {"href": "/for/video-production-agencies", "label": "Duely for Video Production"}
    ],
    "invoice-collections-automation": [
        {"href": "/alternatives/duely-vs-upflow", "label": "Duely vs Upflow"},
        {"href": "/alternatives/duely-vs-paidnice", "label": "Duely vs Paidnice"},
        {"href": "/alternatives/duely-vs-chaser", "label": "Duely vs Chaser"}
    ]
}

for key, links in mapping.items():
    pattern = rf'(id:\s*"{key}",)'
    links_str = " relatedLinks: " + json.dumps(links) + ","
    content = re.sub(pattern, r'\1\n  ' + links_str, content)

with open('lib/seo-data.ts', 'w') as f:
    f.write(content)
