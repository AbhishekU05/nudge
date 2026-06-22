import fetch from 'node-fetch';

async function run() {
  const cookie = '...'; // Not needed if we hit cron route
  // The cron route app/api/cron/sync-xero/route.ts uses a GET request and checks Authorization header.
  const res = await fetch('http://localhost:3000/api/cron/sync-xero', {
    headers: { 'Authorization': `Bearer CRON_SECRET` } // Wait, what is the cron secret?
  });
}
