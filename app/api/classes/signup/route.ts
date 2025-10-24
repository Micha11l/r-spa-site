// app/api/classes/signup/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

    const { data: u, error: uErr } = await supabaseAdmin.auth.getUser(token);
    if (uErr || !u?.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const body = await req.json();
    const { class_type, date, start, end } = body || {};
    if (!class_type || !date || !start || !end) {
      return NextResponse.json({ error: "class_type, date, start, end required" }, { status: 400 });
    }

    // 保证同一用户同一时段只能报一次
    const { error } = await supabaseAdmin.from("class_signups").upsert({
      user_id: u.user.id,
      email: u.user.email,
      full_name: u.user.user_metadata?.full_name || null,
      class_type,
      class_date: date,
      start_time: start,
      end_time: end,
    }, { onConflict: "user_id,class_date,start_time,class_type" });

    if (error) {
      console.error("[/api/classes/signup]", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Signed up! We’ll email you once the class reaches 5 people." });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 400 });
  }
}