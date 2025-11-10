// app/pay/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
  appInfo: { name: "Rejuvenessence", version: "1.0.0" },
});

export async function POST(req: Request) {
  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const { bookingId } = await req.json();

    const { data: rows, error } = await supabaseAdmin
      .from("bookings")
      .select("id,status,customer_email,customer_name,deposit_cents,deposit_paid")
      .eq("id", bookingId)
      .single();

    if (error || !rows) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (rows.deposit_paid || rows.status === "confirmed") {
      return NextResponse.json({ alreadyPaid: true });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: bookingId,
      customer_email: rows.customer_email || undefined,
      metadata: { booking_id: bookingId },
      success_url: `${origin}/pay/${bookingId}?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pay/${bookingId}?canceled=1`,
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: { name: "Deposit for booking" },
            unit_amount: rows.deposit_cents || 5000,
          },
          quantity: 1,
        },
      ],
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}