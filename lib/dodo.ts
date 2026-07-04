import "server-only";

import DodoPayments from "dodopayments";

import { getRequiredEnv } from "@/lib/env";
import type { PricingPlanType } from "@/lib/types";

type DodoEnvironment = "test_mode" | "live_mode";

let client: DodoPayments | null = null;

function getDodoEnvironment(): DodoEnvironment {
  const value = process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode";

  if (value !== "test_mode" && value !== "live_mode") {
    throw new Error(
      'DODO_PAYMENTS_ENVIRONMENT must be either "test_mode" or "live_mode".',
    );
  }

  return value;
}

export function getDodoClient(): DodoPayments {
  if (!client) {
    const env = getDodoEnvironment();
    client = new DodoPayments({
      bearerToken: env === "test_mode" 
        ? getRequiredEnv("DODO_PAYMENTS_TEST_API_KEY") 
        : getRequiredEnv("DODO_PAYMENTS_API_KEY"),
      environment: env,
    });
  }

  return client;
}

export function getDodoProductId(plan: PricingPlanType): string {
  const env = getDodoEnvironment();
  const isTest = env === "test_mode";

  if (plan === "monthly") {
    return isTest
      ? getRequiredEnv("DODO_PAYMENTS_TEST_MONTHLY_PRODUCT_ID")
      : getRequiredEnv("DODO_PAYMENTS_MONTHLY_PRODUCT_ID");
  }

  if (plan === "annual") {
    return isTest
      ? getRequiredEnv("DODO_PAYMENTS_TEST_ANNUAL_PRODUCT_ID")
      : getRequiredEnv("DODO_PAYMENTS_ANNUAL_PRODUCT_ID");
  }

  throw new Error(`Unsupported checkout plan: ${plan}`);
}

export function getDodoWebhookKey(): string {
  const env = getDodoEnvironment();
  return env === "test_mode"
    ? getRequiredEnv("DODO_PAYMENTS_TEST_WEBHOOK_KEY")
    : getRequiredEnv("DODO_PAYMENTS_WEBHOOK_KEY");
}
