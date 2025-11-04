// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPaymentSuccessEmail } from "@/lib/emails";

export const runtime = "nodejs"; // 确保 Webhook 运行在 Node 环境中
export const dynamic = "force-dynamic";

// ✅ Stripe Webhook handler
export async function POST(req: Request) {
  const sig = headers().get("stripe-signature");
  if (!sig) {
    console.error("[stripe webhook] Missing signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  const rawBody = await req.text();

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("[stripe webhook] signature error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    // ✅ 只监听付款成功事件
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const bookingId = session.metadata?.booking_id;
      const paymentIntent = session.payment_intent as string | null;

      if (!bookingId) {
        console.warn("[stripe webhook] Missing booking_id in metadata");
        return NextResponse.json({ ok: false, reason: "no booking_id" });
      }

      console.log(`[stripe webhook] Payment success for booking ${bookingId}`);

      // ✅ 更新 Supabase 数据库
      const { error: updateError } = await supabaseAdmin
        .from("bookings")
        .update({
          status: "confirmed",
          payment_intent_id: paymentIntent ?? null,
          deposit_paid: true,
          deposit_paid_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (updateError) {
        console.error("[stripe webhook] DB update failed:", updateError);
      }

      // ✅ 读取客户信息
      const { data: booking, error: readError } = await supabaseAdmin
        .from("bookings")
        .select(
          "customer_email, customer_name, service_name, start_at, deposit_cents"
        )
        .eq("id", bookingId)
        .maybeSingle();

      if (readError) {
        console.error("[stripe webhook] Failed to read booking:", readError);
        return NextResponse.json({ error: "DB read failed" }, { status: 500 });
      }

      // ✅ 发送确认邮件
      if (booking?.customer_email && booking?.service_name && booking?.start_at) {
        const email = booking.customer_email;
        const name = booking.customer_name || "Guest";
        const service = booking.service_name;
        const start = new Date(booking.start_at).toLocaleString("en-CA", {
          timeZone: "America/Toronto",
          dateStyle: "medium",
          timeStyle: "short",
        });

        try {
          await sendPaymentSuccessEmail(email, name, service, start);
          console.log(`[email] Payment confirmation sent to ${email}`);
        } catch (mailErr: any) {
          console.error("[email] Failed to send payment confirmation:", mailErr);
        }
      } else {
        console.warn("[stripe webhook] Missing customer email or service name");
      }
    }

    // ✅ 返回成功响应
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[stripe webhook] Unhandled error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
