// app/api/admin/bookings/route.ts
import { NextResponse } from "next/server";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import { supabaseAdmin } from "@/lib/supabase";

dayjs.extend(utc);
dayjs.extend(tz);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const TZ = process.env.TIMEZONE || "America/Toronto";

// 安全地把任意 from/to 字符串（YYYY-MM-DD 或 ISO）变成“当天在 TZ 的开始/下一天开始（UTC）”
function toUtcDayRange(fromStr: string, toStr: string) {
  // 只取前 10 位保证是 YYYY-MM-DD（即使传了 ISO 也能稳）
  const fromDateOnly = fromStr.slice(0, 10);
  const toDateOnly = toStr.slice(0, 10);

  const fromUTC = dayjs.tz(fromDateOnly, "YYYY-MM-DD", TZ)
    .startOf("day")
    .utc()
    .toISOString();

  // 右开区间：下一天 00:00
  const toUTC = dayjs.tz(toDateOnly, "YYYY-MM-DD", TZ)
    .add(1, "day")
    .startOf("day")
    .utc()
    .toISOString();

  return { fromUTC, toUTC };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (!from || !to) {
      return NextResponse.json({ error: "from/to required" }, { status: 400 });
    }

    const { fromUTC, toUTC } = toUtcDayRange(from, to);

    const { data, error } = await supabaseAdmin
      .from("bookings") // ✅ 只查这张表
      .select(
        "id, service_name, start_at, end_at, status, customer_name, customer_phone, notes"
      )
      .gte("start_at", fromUTC)
      .lt("start_at", toUTC)
      .order("start_at", { ascending: true });

    if (error) throw error;

    const events = (data ?? []).map((r) => ({
      id: r.id,
      title: `${r.service_name}${r.status === "cancelled" ? " (cancelled)" : ""}`,
      start: r.start_at,
      end: r.end_at,
      status: r.status,
      name: r.customer_name,
      phone: r.customer_phone,
      notes: r.notes ?? "",
    }));

    return NextResponse.json(events, { status: 200 });
  } catch (e: any) {
    console.error("[admin/bookings] error", e);
    return NextResponse.json({ error: e.message || "server error" }, { status: 500 });
  }
}