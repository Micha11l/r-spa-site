// app/api/admin/bookings/route.ts
import { NextResponse, NextRequest } from "next/server";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { supabaseAdmin } from "@/lib/supabase";

dayjs.extend(utc);

// ✅ 关键：强制动态 & 不缓存
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  try {
    // 用 NextRequest 的 nextUrl 更直观
    const { searchParams } = req.nextUrl;
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to");     // YYYY-MM-DD
    if (!from || !to) {
      return NextResponse.json({ error: "from/to required" }, { status: 400 });
    }

    const fromISO = dayjs(from).startOf("day").toISOString();
    const toISO = dayjs(to).endOf("day").toISOString();

    // 统一查询 public.bookings 表（字段：start_at / end_at）
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("id, service_name, start_at, end_at, status, customer_name, customer_phone, notes")
      .gte("start_at", fromISO)
      .lt("start_at", toISO)
      .order("start_at", { ascending: true });

    if (error) {
      console.error("[admin/bookings] db error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const events = (data || []).map((r) => ({
      id: r.id,
      title: `${r.service_name}${r.status === "cancelled" ? " (cancelled)" : ""}`,
      start: r.start_at,
      end: r.end_at,
      status: r.status,
      name: r.customer_name,
      phone: r.customer_phone,
      notes: r.notes ?? "",
    }));

    return NextResponse.json(events, {
      status: 200,
      headers: { "Cache-Control": "no-store" }, // 再保险
    });
  } catch (e: any) {
    console.error("[admin/bookings] error", e);
    return NextResponse.json({ error: e.message || "server error" }, { status: 500 });
  }
}