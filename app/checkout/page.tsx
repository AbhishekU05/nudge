"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type RazorpayCheckoutOptions = {
  key: string | undefined;
  subscription_id: string;
  name: string;
  description: string;
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
  handler: () => void;
};

type RazorpayCheckout = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get("subscriptionId");

  useEffect(() => {
    if (!subscriptionId) return;

    const loadRazorpay = async () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          subscription_id: subscriptionId,
          name: "Duely",
          description: "Monthly Subscription",
          theme: {
            color: "#18181b",
          },
          modal: {
            ondismiss: () => {
              window.location.href = "/settings/billing?canceled=true";
            },
          },
          handler: () => {
            window.location.href = "/dashboard?success=Subscription+successful";
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };
    };

    loadRazorpay();
  }, [subscriptionId]);

  return <p>Redirecting to payment...</p>;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <CheckoutContent />
    </Suspense>
  );
}
