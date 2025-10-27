// app/api/admin/bookings/route.ts
import { NextResponse } from "next/server";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { supabaseAdmin } from "@/lib/supabase";

dayjs.extend(utc);
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get("from"); // YYYY-MM-DD
    const to = url.searchParams.get("to");     // YYYY-MM-DD
    if (!from || !to) {
      return NextResponse.json({ error: "from/to required" }, { status: 400 });
    }

    const fromISO = dayjs(from).startOf("day").toISOString();
    const toISO = dayjs(to).endOf("day").toISOString();

    // ✅ 统一查 public.bookings（新表）
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

    return NextResponse.json(events, { status: 200 });
  } catch (e: any) {
    console.error("[admin/bookings] error", e);
    return NextResponse.json({ error: e.message || "server error" }, { status: 500 });
  }
}