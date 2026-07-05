import re
import os

def fix_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, "r") as f:
        content = f.read()

    # We need to replace the old fetch logic with the new one
    # For pipeline/page.tsx
    if "pipeline/page.tsx" in filepath:
        new_logic = """
  const [invoicesRes, paymentsRes] = await Promise.all([
    supabase.from("invoices").select("*, clients(name, email)").order("created_at", { ascending: false }),
    supabase.from("payments").select("*")
  ]);

  const allCustomers = (invoicesRes.data || []).map((inv: any) => {
    const invPayments = (paymentsRes.data || []).filter((p: any) => p.invoice_id === inv.id);
    const amount_paid = invPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    return {
      ...inv,
      amount_owed: inv.amount,
      amount_paid,
      workflow_status: inv.status,
      customer_id: inv.client_id
    };
  }) as CustomerRecord[];
"""
        content = re.sub(r'const \{ data, error \} = await supabase\s*\.from\("invoices"\)\s*\.select\("\*"\)\s*\.order\("created_at", \{ ascending: false \}\);\s*if \(error\) \{\s*console\.error\("Error fetching customers for pipeline:", error\);\s*\}\s*const allCustomers = \(data \|\| \[\]\) as CustomerRecord\[\];', new_logic.strip(), content, flags=re.DOTALL)

    # For invoices/page.tsx
    elif "invoices/page.tsx" in filepath:
        content = content.replace('.from("invoices")\n        .select("*")', '.from("invoices")\n        .select("*, clients(name, email)")')
        content = content.replace('.from("events")\n        .select("*")', '.from("events")\n        .select("*, clients(name, email), invoices(clients(name, email))")')
        content = content.replace('.from("payments")\n        .select("*")', '.from("payments")\n        .select("*, invoices(clients(name, email))")')

    # For customers/page.tsx
    elif "customers/page.tsx" in filepath:
        content = content.replace('.from("invoices")\n        .select("*")', '.from("invoices")\n        .select("*, clients(name, email)")')
        content = content.replace('.from("events")\n        .select("*")', '.from("events")\n        .select("*, clients(name, email), invoices(clients(name, email))")')
        content = content.replace('.from("payments")\n        .select("*")', '.from("payments")\n        .select("*, invoices(clients(name, email))")')

    # For analytics/page.tsx
    elif "analytics/page.tsx" in filepath:
        content = content.replace('.from("events")\n        .select("*")', '.from("events")\n        .select("*, clients(name, email), invoices(clients(name, email))")')
        content = content.replace('.from("payments")\n        .select("*")', '.from("payments")\n        .select("*, invoices(clients(name, email))")')
        # the invoices query was partially updated to .select("*, clients(name)") but should be name, email
        content = content.replace('supabase.from("invoices").select("*, clients(name)")', 'supabase.from("invoices").select("*, clients(name, email)")')
        
    # For activity/page.tsx
    elif "activity/page.tsx" in filepath:
        content = content.replace('.from("events")\n        .select("*")', '.from("events")\n        .select("*, clients(name, email), invoices(clients(name, email))")')
        content = content.replace('.from("payments")\n        .select("*")', '.from("payments")\n        .select("*, invoices(clients(name, email))")')
        content = content.replace('supabase.from("invoices").select("*")', 'supabase.from("invoices").select("*, clients(name, email)")')

    with open(filepath, "w") as f:
        f.write(content)
    print(f"Fixed {filepath}")

fix_file("app/(app)/pipeline/page.tsx")
fix_file("app/(app)/invoices/page.tsx")
fix_file("app/(app)/customers/page.tsx")
fix_file("app/(app)/analytics/page.tsx")
fix_file("app/(app)/activity/page.tsx")
