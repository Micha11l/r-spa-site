import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";


export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from"); // ISO
  const to = url.searchParams.get("to");     // ISO

  let query = supabaseAdmin.from("bookings").select("*").order("start_ts", { ascending: true });
  if (from) query = query.gte("start_ts", from);
  if (to) query = query.lte("end_ts", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data });
}