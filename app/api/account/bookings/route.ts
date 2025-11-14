// app/api/account/bookings/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const nowISO = new Date().toISOString();

  // 你的表：bookings（列名前面代码已对齐）
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id,service_name,start_at,end_at,status,notes,customer_email")
    .ilike("customer_email", email);

  if (error) {
    console.error("[/api/account/bookings]", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const upcoming = (data || []).filter((b) => b.start_at >= nowISO && b.status !== "cancelled");
  const past = (data || []).filter((b) => b.start_at < nowISO);

  // 按时间排序
  upcoming.sort((a, b) => a.start_at.localeCompare(b.start_at));
  past.sort((a, b) => b.start_at.localeCompare(a.start_at));

  return NextResponse.json({ upcoming, past });
}