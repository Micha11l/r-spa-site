import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { booking_id } = await req.json();
    if (!booking_id) {
      return NextResponse.json({ error: "booking_id required" }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    // 1️⃣ 读取预约记录
    const { data: bk, error: e1 } = await supabase
      .from("bookings")
      .select("id, customer_email, customer_name, service_name, status, price_cents, deposit_cents, start_at")
      .eq("id", booking_id)
      .maybeSingle();

    if (e1 || !bk) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // 防止重复生成支付链接
    if (bk.status === "confirmed") {
      return NextResponse.json({ error: "Already confirmed" }, { status: 400 });
    }

    // 价格兜底：若没设价格，先按 $100 做演示
    const priceCents = bk.price_cents && bk.price_cents > 0 ? bk.price_cents : 10000;
    const depositCents = Math.round(priceCents * 0.5);

    // 更新状态为待付款
    await supabase
      .from("bookings")
      .update({
        status: "awaiting_payment",
        price_cents: priceCents,
        deposit_cents: depositCents,
      })
      .eq("id", booking_id);

    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // 2️⃣ 创建 Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: bk.customer_email || undefined,
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
      success_url: `${origin}/pay/${booking_id}?success=true`,
      cancel_url: `${origin}/pay/${booking_id}?canceled=true`,

      // ✅ webhook 会从这里读取 booking_id
      metadata: {
        booking_id,
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("[deposit session]", err);
    return NextResponse.json({ error: err.message || "failed" }, { status: 500 });
  }
}
