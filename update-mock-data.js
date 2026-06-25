const fs = require('fs');

const data = JSON.parse(fs.readFileSync('output.json', 'utf8'));

const output = `// Auto-generated from real user data
import { CustomerRecord, CustomerEvent, ClientRecord, InvoiceRecord } from "./types";

export const mockClients: any[] = ${JSON.stringify(data.clients, null, 2)};

export const mockInvoices: any[] = ${JSON.stringify(data.invoices, null, 2)};

export const mockEvents: any[] = ${JSON.stringify(data.events || [], null, 2)};

export const mockGroups: any[] = ${JSON.stringify(data.groups || [], null, 2)};

export const mockCustomers = mockClients.map(client => ({
  id: client.id,
  name: client.name,
  email: client.email || "billing@example.com",
  status: "active",
  created_at: client.created_at,
  totalOwed: mockInvoices.filter(i => i.customer_id === client.id).reduce((sum, i) => sum + i.amount_owed, 0),
  totalPaid: mockInvoices.filter(i => i.customer_id === client.id).reduce((sum, i) => sum + (i.amount_paid || 0), 0)
}));
`;

fs.writeFileSync('lib/mock-data.ts', output);
console.log('Done!');
