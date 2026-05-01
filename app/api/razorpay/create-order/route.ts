import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getRequiredEnv } from "@/lib/env";

const razorpay = new Razorpay({
  key_id: getRequiredEnv("RAZORPAY_KEY_ID"),
  key_secret: getRequiredEnv("RAZORPAY_KEY_SECRET"),
});

export async function POST() {
  const order = await razorpay.orders.create({
  amount: 100,
  currency: "INR",
  receipt: "nudge-subscription",
  notes: {
    user_id: user.id, // THIS is what you need
  },
});

  return NextResponse.json({ orderId: order.id });
}
