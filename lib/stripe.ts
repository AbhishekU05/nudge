import "server-only";

import Stripe from "stripe";

import { getRequiredEnv } from "@/lib/env";
import { getAppUrl } from "@/lib/email/reminder";

export function createStripeClient() {
  return new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
}

export function getStripeConnectCallbackUrl() {
  return `${getAppUrl()}/api/stripe/callback`;
}

export function getStripeConnectAuthorizeUrl() {
  const params = new URLSearchParams({
    client_id: getRequiredEnv("NEXT_PUBLIC_STRIPE_CLIENT_ID"),
    response_type: "code",
    scope: "read_write",
    redirect_uri: getStripeConnectCallbackUrl(),
  });

  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
}
