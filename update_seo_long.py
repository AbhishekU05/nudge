import re

with open('lib/seo-data.ts', 'r') as f:
    content = f.read()

# Update the interface
content = content.replace(
    "relatedLinks?: { href: string; label: string }[];",
    "relatedLinks?: { href: string; label: string }[];\n  category?: string;\n  slug?: string;\n  longContent?: {\n    type: 'competitor' | 'industry' | 'integration' | 'location' | 'use-case';\n    data: any;\n  };"
)

# We will inject category, slug, and longContent using regex for each block.
# We know which block is which based on the variable name (competitors, industries, etc.)

blocks = {
    "competitors": ("competitor", "alternatives/duely-vs-"),
    "industries": ("industry", "for/"),
    "integrations": ("integration", "integrations/"),
    "locations": ("location", "location/"),
    "useCases": ("use-case", "use-case/")
}

def get_long_content(block_type, key):
    if block_type == "competitor":
        return f"""{{
      type: 'competitor',
      data: {{
        theirWeaknesses: ['Requires logging into a separate portal to send messages', 'Emails come from a generic, no-reply address that clients ignore', 'Pricing scales up aggressively based on invoice volume or user seats', 'Built for massive enterprise finance teams, not agency owners', 'Forces your clients to use a clunky proprietary payment portal'],
        ourStrengths: ['Reminders are sent directly from your own Gmail outbox', 'Clients reply directly to you, preserving the personal relationship', 'Flat $29/mo pricing no matter how many invoices you chase', 'Built specifically for the workflows of small agencies and freelancers', 'Tracks every payment promise and follow-up in a clear pipeline'],
        conclusion: 'When comparing Duely to {key.capitalize()}, the choice comes down to how you want to interact with your clients. If you want a corporate, robotic system that sends no-reply emails, {key.capitalize()} works. But if you want to preserve your client relationships while getting paid faster, Duely is the only platform that uses your real email outbox to send friendly, founder-led follow-ups.'
      }}
    }}"""
    elif block_type == "industry":
        return f"""{{
      type: 'industry',
      data: {{
        challenge1: 'Scope creep and misaligned payment milestones. {key.capitalize()} often start work in good faith, only to find that invoices for deposits or mid-project milestones are ignored, causing severe cash flow bottlenecks.',
        challenge2: 'Fear of damaging the client relationship. As an owner-led business, asking for money feels awkward. You delay sending reminders because you do not want to sound desperate or angry.',
        challenge3: 'Disorganized promise tracking. A client says "I will pay on Friday" in a Slack message or email. Friday comes and goes, and because it was not tracked centrally, you forget to follow up until weeks later.',
        solution: 'Duely solves this by automating the awkwardness. It connects to your Gmail so reminders look completely manual and personal. It tracks promises automatically, and gives you a clear Kanban view of exactly where every client is in the collections process, ensuring your {key.replace("-", " ")} maintains healthy cash flow.'
      }}
    }}"""
    elif block_type == "integration":
        return f"""{{
      type: 'integration',
      data: {{
        step1: 'Connect your {key.capitalize()} account in one click. Duely uses secure OAuth to sync your contacts, invoices, and payment statuses in real-time. No manual data entry required.',
        step2: 'Map your invoice statuses to Duelys pipeline. Overdue invoices automatically flow into the "Outstanding" column, ready for action.',
        step3: 'Set up your smart reminder templates. Configure friendly 3-day, 7-day, and 14-day follow-ups that will be sent directly from your synced Gmail account.',
        step4: 'Let Duely take over. As payments are recorded in {key.capitalize()}, Duely instantly stops the reminders and moves the client to "Paid". You never accidentally chase a client who has already settled their bill.',
        benefit: 'This seamless {key.capitalize()} integration means you get the power of enterprise accounts receivable automation without leaving the accounting software you already know and trust.'
      }}
    }}"""
    elif block_type == "location":
        return f"""{{
      type: 'location',
      data: {{
        culture: 'In {key.capitalize()}, the business culture heavily values prompt communication, but late payments remain a systemic issue for small businesses. Agencies often wait 30 to 45 days beyond the due date simply because they lack a systematic follow-up process.',
        legal: 'While local regulations may allow for charging late fees, most agency owners hesitate to enforce them for fear of losing future business. A polite, persistent, and automated email strategy is far more effective.',
        solution: 'Duely is optimized for businesses operating in {key.capitalize()}. By sending reminders in your local timezone and from your real email address, it respects local business etiquette while ensuring your invoices stay at the top of your clients inbox.'
      }}
    }}"""
    elif block_type == "use-case":
        return f"""{{
      type: 'use-case',
      data: {{
        problem: 'You run a busy agency. You sent out $30,000 worth of invoices last month, but only $10,000 has cleared. The rest are sitting in a "past due" state. You dread Friday afternoons because it means logging into your accounting software, seeing who owes you money, and drafting awkward emails.',
        solution: 'With Duely, you automate this entire workflow. You connect your Gmail and QuickBooks. You write three friendly templates once. Duely scans your ledger daily and automatically queues up personalized emails to late payers.',
        result: 'Within 30 days, your average days-to-pay drops by 40%. You recover 15 hours a month previously spent chasing clients. Most importantly, your cash flow becomes predictable, allowing you to make confident hiring and spending decisions without the constant anxiety of unpaid invoices.'
      }}
    }}"""

for var_name, (b_type, slug_prefix) in blocks.items():
    # Find the block: export const competitors: Record<string, SEOPageData> = { ... }
    # This is tricky with regex if it's nested. We can match `id: "key",`
    
    # We will just iterate all `id: "(.*?)",`
    # and we know which is which because of the keys we added in the previous script.
    # Actually, let's just do a blanket replace for all ids that belong to a category.
    pass

import ast

def process_file():
    global content
    
    mapping = {
        "paidnice": "competitors",
        "chaser": "competitors",
        "invoiced": "competitors",
        "upflow": "competitors",
        "bill": "competitors",
        "freshbooks": "integrations", # wait freshbooks is both competitor and integration, but id is unique?
        "honeybook": "competitors",
        "xero-reminders": "competitors",
        "quickbooks-reminders": "competitors",
        "marketing-agencies": "industries",
        "web-design-agencies": "industries",
        "content-agencies": "industries",
        "video-production-agencies": "industries",
        "pr-agencies": "industries",
        "consultants": "industries",
        "freelance-designers": "industries",
        "copywriters": "industries",
        "creative-agencies": "industries",
        "quickbooks": "integrations",
        "xero": "integrations",
        "stripe": "integrations",
        "us": "locations",
        "uk": "locations",
        "canada": "locations",
        "australia": "locations",
        "london": "locations",
        "new-york": "locations",
        "sydney": "locations",
        "toronto": "locations",
        "melbourne": "locations",
        "automate-invoice-reminders": "useCases",
        "follow-up-overdue-invoices": "useCases",
        "get-freelance-invoices-paid-faster": "useCases",
        "reduce-late-payments": "useCases",
        "invoice-collections-automation": "useCases",
    }
    
    # Actually freshbooks is both a competitor and integration in the original seo-data.ts
    # In seo-data.ts, we have:
    # export const competitors: Record<string, SEOPageData> = { freshbooks: { id: "freshbooks", ... } }
    # export const integrations: Record<string, SEOPageData> = { freshbooks: { id: "freshbooks", ... } }
    
    # To be safe, let's process the file using string manipulation.
    
    new_content = ""
    current_block = None
    
    for line in content.split('\n'):
        if 'export const competitors' in line:
            current_block = 'competitor'
            prefix = "alternatives/duely-vs-"
        elif 'export const industries' in line:
            current_block = 'industry'
            prefix = "for/"
        elif 'export const integrations' in line:
            current_block = 'integration'
            prefix = "integrations/"
        elif 'export const locations' in line:
            current_block = 'location'
            prefix = "location/"
        elif 'export const useCases' in line:
            current_block = 'use-case'
            prefix = "use-case/"
            
        new_content += line + '\n'
        
        m = re.search(r'id:\s*"([^"]+)"', line)
        if m and current_block:
            key = m.group(1)
            lc = get_long_content(current_block, key)
            slug = f"{prefix}{key}"
            if current_block == 'competitor' and slug == "alternatives/duely-vs-freshbooks":
                pass # it's fine
            if current_block == 'integration' and key == 'freshbooks':
                slug = f"integrations/freshbooks"
                
            injection = f"  category: '{current_block}',\n  slug: '{slug}',\n  longContent: {lc},"
            new_content += injection + '\n'
            
    return new_content

content = process_file()

with open('lib/seo-data.ts', 'w') as f:
    f.write(content)
