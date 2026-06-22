import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { XeroClient } from 'xero-node';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {} as Record<string, string>);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  const { data: users } = await supabase.from('integrations').select('*').eq('provider', 'xero');
  const user = users[0];
  const xero = new XeroClient({
    clientId: env.XERO_CLIENT_ID,
    clientSecret: env.XERO_CLIENT_SECRET,
  });
  xero.setTokenSet({
    access_token: user.access_token,
    refresh_token: user.refresh_token,
  });

  const response1 = await xero.accountingApi.getInvoices(
    user.tenant_id,
    undefined,
    'Type=="ACCREC"',
    "UpdatedDateUTC DESC",
    undefined,
    undefined,
    undefined,
    undefined,
    1,
    false,
    undefined,
    undefined,
    false,
    100
  );
  
  console.log("With Type==ACCREC:", response1.body.invoices?.length);

  const response2 = await xero.accountingApi.getInvoices(
    user.tenant_id,
  );
  console.log("Without any filters:", response2.body.invoices?.length);

  // Let's also check how many have amountOwed <= 0
  let skipped = 0;
  for (const inv of response1.body.invoices || []) {
      const amountDue = Number(inv.amountDue ?? 0);
      const amountPaid = Number(inv.amountPaid ?? 0);
      let total = Number(inv.total ?? 0);
      if (total <= 0) total = amountDue + amountPaid;
      if (total <= 0) skipped++;
  }
  console.log("Skipped due to total <= 0:", skipped);
}
check().catch(console.error);
