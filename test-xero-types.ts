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

  const response2 = await xero.accountingApi.getInvoices(
    user.tenant_id,
  );
  
  const types = {};
  for (const inv of response2.body.invoices || []) {
      const type = String(inv.type);
      types[type] = (types[type] || 0) + 1;
  }
  console.log("Types of all invoices:", types);
}
check().catch(console.error);
