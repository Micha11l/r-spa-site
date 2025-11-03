import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { headers } from "next/headers";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get("stripe-signature")!;
  let evt;

  try {
    evt = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("[stripe webhook] signature error", err.message);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    if (evt.type === "checkout.session.completed") {
      const s = evt.data.object as any;
      const pi = s.payment_intent as string | undefined;
      const booking_id = s.metadata?.booking_id;

      if (!booking_id) {
        console.warn("[stripe webhook] Missing booking_id in metadata");
        return NextResponse.json({ ok: false, reason: "no booking_id" });
      }

      const supabase = supabaseAdmin;

      // ✅ 更新 booking 状态
      const { error: updErr } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          payment_intent_id: pi ?? null,
          deposit_paid: true,
          deposit_paid_at: new Date().toISOString(),
        })
        .eq("id", booking_id);

      if (updErr) console.error("[stripe webhook] update failed", updErr);

      // ✅ 查询并发送确认邮件
      const { data: bk, error: readErr } = await supabase
        .from("bookings")
        .select("customer_email, customer_name, service_name, start_at, deposit_cents")
        .eq("id", booking_id)
        .maybeSingle();

      if (readErr) console.error("[stripe webhook] read failed", readErr);

      if (bk?.customer_email) {
        await resend.emails.send({
          from: "Rejuvenessence <noreply@rejuvenessence.org>",
          to: [bk.customer_email],
          subject: "Your appointment is confirmed",
          html: `
            <p>Hi ${bk.customer_name || ""},</p>
            <p>Your deposit has been received. Your appointment for <b>${bk.service_name}</b> is now <b>confirmed</b>.</p>
            <p>Time: ${bk.start_at}</p>
            <p>Deposit received: $${((bk.deposit_cents || 0) / 100).toFixed(2)}</p>
            <p>Free cancel ≥48h; within 24h deposit is non-refundable.</p>
            <p>See you soon!</p>
          `,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[stripe webhook] error", err);
    return NextResponse.json({ error: "webhook failed" }, { status: 500 });
  }
}
