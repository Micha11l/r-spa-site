import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import dayjs from "dayjs";

export async function POST(req: Request) {
  const { booking_id, reason } = await req.json();
  if (!booking_id) return NextResponse.json({ error: "booking_id required" }, { status: 400 });

  const supabase = supabaseAdmin;

  const { data: bk, error: e1 } = await supabase
    .from("bookings")
    .select("id, status, start_ts, payment_intent_id, deposit_cents")
    .eq("id", booking_id)
    .maybeSingle();
  if (e1 || !bk) return NextResponse.json({ error: "not found" }, { status: 404 });

  // 未支付定金：直接取消
  if (!bk.payment_intent_id) {
    await supabase.from("bookings").update({ status: "cancelled", cancellation_reason: reason || null }).eq("id", booking_id);
    return NextResponse.json({ ok: true, refund: 0 });
  }

  // 已付定金：计算退款金额
  const start = dayjs(bk.start_ts);
  const now = dayjs();
  const diffH = start.diff(now, "hour"); // 距离开始还有多少小时

  let refund = 0;
  if (diffH >= 48) {
    refund = bk.deposit_cents || 0; // 全额退
  } else if (diffH >= 24) {
    refund = Math.round((bk.deposit_cents || 0) * 0.5); // 退50%
  } else {
    refund = 0; // 不退
  }

  if (refund > 0) {
    await stripe.refunds.create({
      payment_intent: bk.payment_intent_id,
      amount: refund,
    });
  }

  await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      refund_cents: refund,
      refund_status: refund > 0 ? (refund === (bk.deposit_cents || 0) ? "refunded" : "partial") : "none",
      cancellation_reason: reason || null,
    })
    .eq("id", booking_id);

  return NextResponse.json({ ok: true, refund_cents: refund });
}
