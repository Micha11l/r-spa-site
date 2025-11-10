import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL!;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await req.json();
  const { amount, sender_name, sender_email, recipient_name, recipient_email, message } = body || {};
  if (!amount || amount < 150) return NextResponse.json({ error: "Minimum CAD 150" }, { status: 400 });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "cad",
        product_data: { name: "Rejuvenessence Gift Card" },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    }],
    success_url: `${origin}/gift-card/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/gift-card`,
    metadata: { 
      kind: "giftcard",
      sender_name, 
      sender_email, 
      recipient_name, 
      recipient_email, 
      message, 
      amount: String(amount) 
    },
  });

  return NextResponse.json({ url: session.url });
}