// app/api/admin/bookings/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from")!;
  const to = url.searchParams.get("to")!;

  let query = supabaseAdmin
    .from("bookings")
    .select("id, service_name, start_ts, end_ts, customer_name, customer_phone, notes, status")
    .order("start_ts", { ascending: true });

  if (from) query = query.gte("start_ts", from);
  if (to) query = query.lte("end_ts", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data });
}