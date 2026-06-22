import { syncXeroInvoicesForUser } from './test-xero';

async function check() {
  try {
    const res = await syncXeroInvoicesForUser('859c2442-cf2b-4f15-aa00-683e66dda8f2');
    console.log("Sync Result:", res);
  } catch (err) {
    console.error("Sync Error:", err);
  }
}
check();
