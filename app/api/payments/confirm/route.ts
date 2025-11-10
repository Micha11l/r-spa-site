// app/api/payments/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
  });

export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent"],
    });

    if (!session || session.payment_status !== "paid") {
      return NextResponse.json({ ok: false, reason: "not_paid" }, { status: 200 });
    }

    const bookingId =
      (session.client_reference_id as string) ||
      (session.metadata?.booking_id as string);

    if (!bookingId) {
      return NextResponse.json({ ok: false, reason: "no_booking" }, { status: 200 });
    }

    const pi = session.payment_intent as Stripe.PaymentIntent | string | null;
    const paymentIntentId = typeof pi === "string" ? pi : pi?.id ?? null;
    const amount = session.amount_total ?? session.amount_subtotal ?? undefined;

    const { error: upErr } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "confirmed",
        deposit_paid: true,
        deposit_paid_at: new Date().toISOString(),
        payment_intent_id: paymentIntentId,
        deposit_cents: amount,
      })
      .eq("id", bookingId);

    if (upErr) {
      console.error("[confirm] supabase update error:", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[confirm] error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}