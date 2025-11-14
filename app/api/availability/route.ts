// app/api/availability/route.ts
import { NextResponse } from "next/server";
import dayjs from "dayjs";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date"); // YYYY-MM-DD
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const dayStart = dayjs(`${date} 00:00`).toISOString();
  const dayEnd = dayjs(`${date} 23:59`).toISOString();

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("start_ts, end_ts, status")
    .gte("start_ts", dayStart)
    .lte("end_ts", dayEnd);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    busy: (data || []).map((r) => ({ start: r.start_ts, end: r.end_ts })),
  });
}