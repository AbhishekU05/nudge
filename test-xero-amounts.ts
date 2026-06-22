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

function getInvoiceTotal(invoice: any) {
  const total = Number(invoice.total ?? 0);
  if (total > 0) return Math.round(total * 100) / 100;
  const amountDue = Number(invoice.amountDue ?? 0);
  const amountPaid = Number(invoice.amountPaid ?? 0);
  return Math.round((amountDue + amountPaid) * 100) / 100;
}

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
  
  let validCount = 0;
  let invalidCount = 0;
  for (const inv of response1.body.invoices || []) {
      const amountOwed = getInvoiceTotal(inv);
      if (amountOwed <= 0) {
        invalidCount++;
      } else {
        validCount++;
      }
  }
  console.log(`Valid (amountOwed > 0): ${validCount}, Invalid (amountOwed <= 0): ${invalidCount}`);
}
check().catch(console.error);
