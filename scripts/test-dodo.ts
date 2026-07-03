import { DodoPayments } from "dodopayments";
import * as fs from "fs";

const envStr = fs.readFileSync(".env.local", "utf-8");
envStr.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
});

async function testDodo() {
  console.log("Initializing Dodo...");
  console.log("API Key exists:", !!process.env.DODO_PAYMENTS_API_KEY);
  console.log("Monthly Product ID:", process.env.DODO_PAYMENTS_MONTHLY_PRODUCT_ID);

  const client = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
  });

  try {
    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: process.env.DODO_PAYMENTS_MONTHLY_PRODUCT_ID || "prod_123", quantity: 1 }],
      return_url: "http://localhost:3000/settings/billing?success=true",
      customer: {
        email: "test@example.com",
        name: "Test User",
      },
    });
    console.log("Success! Session:", session);
  } catch (error) {
    console.error("Dodo API Error:");
    console.error(error);
  }
}

testDodo();
