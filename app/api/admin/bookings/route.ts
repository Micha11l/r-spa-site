// app/api/admin/bookings/route.ts
import { NextResponse, NextRequest } from "next/server";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

    let query = supabaseAdmin
      .from("bookings")
      .select(
        "id, service_name, start_at, end_at, status, customer_name, customer_phone, customer_email, notes"
      );

    if (statusParam) {
      query = query.eq("status", statusParam);
    } else if (fromParam && toParam) {
      query = query
        .gte("start_at", parseDayToUTCStart(fromParam))
        .lt("start_at", parseDayToUTCExclusiveNext(toParam));
    }

    const { data, error } = await query.order("start_at", { ascending: true });
    if (error) throw error;

    const events = (data ?? []).map((r) => ({
      id: r.id,
      service_name: r.service_name,
      title: `${r.service_name}${r.status === "cancelled" ? " (cancelled)" : ""}`,
      start: r.start_at,
      end: r.end_at,
      status: r.status,
      name: r.customer_name,
      email: r.customer_email,
      phone: r.customer_phone,
      notes: r.notes ?? "",
    }));

    return NextResponse.json(events, { status: 200 });
  } catch (e: any) {
    console.error("[admin/bookings] error:", e);
    return NextResponse.json({ error: e.message || "server error" }, { status: 500 });
  }
}
