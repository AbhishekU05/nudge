import { createClient } from '@supabase/supabase-js';
import { inngest } from '../lib/inngest/client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrate() {
  console.log("Starting migration to Inngest event loop...");

  // 1. Migrate Active Invoices
  console.log("Fetching active invoices...");
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, organization_id')
    .eq('reminders_enabled', true)
    .neq('status', 'paid');

  if (invoices) {
    console.log(`Found ${invoices.length} active invoices.`);
    const events = invoices.map(inv => ({
      name: "automation.enabled",
      data: { entityId: inv.id, entityType: "invoice", organizationId: inv.organization_id }
    }));
    if (events.length > 0) {
      // @ts-ignore
      await inngest.send(events);
      console.log(`Dispatched ${events.length} invoice automation events.`);
    }
  }

  // 2. Migrate Active Clients
  console.log("Fetching active clients...");
  const { data: clients } = await supabase
    .from('clients')
    .select('id, organization_id')
    .eq('active', true);

  if (clients) {
    console.log(`Found ${clients.length} active clients.`);
    const events = clients.map(client => ({
      name: "automation.enabled",
      data: { entityId: client.id, entityType: "client", organizationId: client.organization_id }
    }));
    if (events.length > 0) {
      // @ts-ignore
      await inngest.send(events);
      console.log(`Dispatched ${events.length} client automation events.`);
    }
  }

  console.log("Migration complete!");
}

migrate().catch(console.error);
