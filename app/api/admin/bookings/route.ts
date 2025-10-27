// app/api/admin/bookings/route.ts
import { NextResponse, NextRequest } from "next/server";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { supabaseAdmin } from "@/lib/supabase";

dayjs.extend(utc);
dayjs.extend(tz);

export const runtime = "nodejs";
// 强制动态 & 禁止缓存
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const TZ = process.env.TIMEZONE || "America/Toronto";

function parseDayToUTCStart(d: string) {
  // 直接把日期当作 UTC 零点，避免重复时区转换
  return dayjs.utc(d).startOf("day").toISOString();
}

function parseDayToUTCExclusiveNext(d: string) {
  // 取下一天的 UTC 零点作为右开区间
  return dayjs.utc(d).add(1, "day").startOf("day").toISOString();
}


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from"); // e.g. 2025-10-01
    const toParam = searchParams.get("to");     // e.g. 2025-10-31

    if (!fromParam || !toParam) {
      return NextResponse.json({ error: "from/to required" }, { status: 400 });
    }

    // 左闭右开 [from, to+1day)
    const fromISO = parseDayToUTCStart(fromParam);
    const toISO   = parseDayToUTCExclusiveNext(toParam);

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, service_name, start_at, end_at, status, customer_name, customer_phone, notes"
      )
      .gte("start_at", fromISO)
      .lt("start_at", toISO)
      .order("start_at", { ascending: true });

    if (error) {
      console.error("[admin/bookings] db error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const events = (data ?? []).map((r) => ({
      id: r.id,
      title: `${r.service_name}${r.status === "cancelled" ? " (cancelled)" : ""}`,
      start: r.start_at, // ISO UTC，FullCalendar能识别
      end: r.end_at,
      status: r.status,
      name: r.customer_name,
      phone: r.customer_phone,
      notes: r.notes ?? "",
    }));

    return NextResponse.json(events, { status: 200 });
  } catch (e: any) {
    console.error("[admin/bookings] error:", e);
    return NextResponse.json({ error: e.message || "server error" }, { status: 500 });
  }
}