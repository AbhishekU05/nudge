import "server-only";

import { getRequiredEnv } from "@/lib/env";

type LemonCheckoutResponse = {
  data: {
    attributes: {
      url: string;
    };
  };
};

type LemonSubscriptionResponse = {
  data: {
    id: string;
    attributes: {
      status: string;
      renews_at: string | null;
      urls?: {
        customer_portal?: string;
      };
    };
  };
};

function lemonHeaders() {
  return {
    Authorization: `Bearer ${getRequiredEnv("LEMON_SQUEEZY_API_KEY")}`,
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
  };
}

export function hasActiveSubscription(status: string | null | undefined) {
  return status === "active" || status === "on_trial";
}

export async function createHostedCheckout(params: {
  userId: string;
  email: string | null;
  successUrl: string;
  cancelUrl: string;
}) {
  const storeId = getRequiredEnv("LEMON_SQUEEZY_STORE_ID");
  const variantId = getRequiredEnv("LEMON_SQUEEZY_VARIANT_ID_MONTHLY");

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: params.email ?? undefined,
          custom: {
            user_id: params.userId,
          },
        },
        product_options: {
          redirect_url: params.successUrl,
          receipt_button_text: "Return to Nudge",
          receipt_link_url: params.successUrl,
        },
        checkout_options: {
          embed: false,
          media: false,
          logo: true,
        },
      },
      relationships: {
        store: { data: { type: "stores", id: String(storeId) } },
        variant: { data: { type: "variants", id: String(variantId) } },
      },
    },
  };

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: lemonHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lemon checkout failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as LemonCheckoutResponse;
  return json.data.attributes.url;
}

export async function getSubscription(subscriptionId: string) {
  const res = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { headers: lemonHeaders() },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lemon subscription fetch failed: ${res.status} ${text}`);
  }

  return (await res.json()) as LemonSubscriptionResponse;
}

