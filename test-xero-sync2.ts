import * as fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) {
    process.env[key.trim()] = value.trim();
  }
  return acc;
}, {} as Record<string, string>);

import { syncXeroInvoicesForUser } from './lib/xero';

async function check() {
  try {
    const res = await syncXeroInvoicesForUser('859c2442-cf2b-4f15-aa00-683e66dda8f2');
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
}
check();
