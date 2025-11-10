// app/api/payments/deposit/route.ts
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
    const { booking_id } = await req.json();
    if (!booking_id) {
      return NextResponse.json({ error: "booking_id required" }, { status: 400 });
    }

    // 读取预约
    const { data: bk, error } = await supabaseAdmin
      .from("bookings")
      .select("id, status, customer_email, customer_name, service_name, price_cents, deposit_cents")
      .eq("id", booking_id)
      .maybeSingle();

    if (error || !bk) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // 已确认则不再创建会话
    if (bk.status === "confirmed") {
      return NextResponse.json({ alreadyPaid: true }, { status: 200 });
    }

    // 价格兜底：如果没设置，按 $100
    const priceCents = bk.price_cents && bk.price_cents > 0 ? bk.price_cents : 10000;
    const depositCents = bk.deposit_cents && bk.deposit_cents > 0
      ? bk.deposit_cents
      : Math.round(priceCents * 0.5);

    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

    // 创建 Stripe Checkout Session（成功必须带 session_id）
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: booking_id,
      customer_email: bk.customer_email || undefined,
      metadata: { booking_id },
      success_url: `${origin}/pay/${booking_id}?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pay/${booking_id}?canceled=1`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: depositCents,
            product_data: {
              name: `Deposit for ${bk.service_name}`,
              description: `50% security deposit — ${bk.customer_name || ""}`.trim(),
            },
          },
        },
      ],
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e: any) {
    console.error("[deposit] error:", e);
    return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
  }
}