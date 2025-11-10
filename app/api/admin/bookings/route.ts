// app/api/admin/bookings/route.ts
import { NextResponse, NextRequest } from "next/server";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import { supabaseAdmin } from "@/lib/supabase";

dayjs.extend(utc);
dayjs.extend(tz);

const TZ = process.env.TIMEZONE || "America/Toronto";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseDayToUTCStart(d: string) {
  return dayjs.utc(d).startOf("day").toISOString();
}
function parseDayToUTCExclusiveNext(d: string) {
  return dayjs.utc(d).add(1, "day").startOf("day").toISOString();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const statusParam = searchParams.get("status");

    // 🔎 把金额/定金相关列一起查出来
    let query = supabaseAdmin
      .from("bookings")
      .select(`
        id,
        service_name,
        start_at,
        end_at,
        status,
        customer_name,
        customer_phone,
        customer_email,
        notes,
        price_cents,
        deposit_cents,
        payment_intent_id,
        deposit_paid,
        deposit_paid_at,
        refund_cents,
        refund_status,
        cancellation_reason,
        created_at,
        completed_at,
        refund_at
      `);

    if (statusParam) {
      query = query.eq("status", statusParam);
    } else if (fromParam && toParam) {
      query = query
        .gte("start_at", parseDayToUTCStart(fromParam))
        .lt("start_at", parseDayToUTCExclusiveNext(toParam));
    }

    const { data, error } = await query.order("start_at", { ascending: true });
    if (error) throw error;

    // FullCalendar 需要标准键（id/title/start/end），其它字段可直接放在根上，
    // 它们会自动出现在 event.extendedProps 里
    const events = (data ?? []).map((r) => ({
      id: r.id,
      title: `${r.service_name}${r.status === "cancelled" ? " (cancelled)" : ""}`,
      start: r.start_at,
      end: r.end_at,

      // 额外信息（会进入 extendedProps）
      service_name: r.service_name,
      status: r.status,
      name: r.customer_name,
      email: r.customer_email,
      phone: r.customer_phone,
      notes: r.notes ?? "",

      // 💰 金额/定金/退款相关（0 也保留）
      price_cents: r.price_cents,
      deposit_cents: r.deposit_cents,
      payment_intent_id: r.payment_intent_id,
      deposit_paid: r.deposit_paid,
      deposit_paid_at: r.deposit_paid_at,
      refund_cents: r.refund_cents,
      refund_status: r.refund_status,

      // 其它可选审计信息
      cancellation_reason: r.cancellation_reason,
      created_at: r.created_at,
      completed_at: r.completed_at,
      refund_at: r.refund_at,
    }));

    return NextResponse.json(events, { status: 200 });
  } catch (e: any) {
    console.error("[admin/bookings] error:", e);
    return NextResponse.json(
      { error: e.message || "server error" },
      { status: 500 }
    );
  }
}