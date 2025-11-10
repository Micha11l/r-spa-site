// app/api/classes/withdraw/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED = new Set(["stretching", "yoga", "pilates"]);
const normDate = (d: string) => d.replace(/\//g, "-");
const normTime = (t: string) => (t.length === 5 ? `${t}:00` : t);

export async function POST(req: Request) {
  // 认证
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: u, error: uErr } = await supabaseAdmin.auth.getUser(auth.slice(7));
  if (uErr || !u.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const email = u.user.email!;

  // 参数
  let body: { class_type?: string; class_date?: string; start_time?: string };
  try { body = await req.json(); } catch { body = {}; }
  const type = (body.class_type || "").toLowerCase();
  const date = body.class_date ? normDate(body.class_date) : "";
  const start = body.start_time ? normTime(body.start_time) : "";

  if (!ALLOWED.has(type) || !date || !start) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // 只把“已报名”的那条改成 withdrawn
  const { data, error } = await supabaseAdmin
    .from("class_signups")
    .update({ status: "withdrawn" })
    .eq("email", email)
    .eq("class_type", type)
    .eq("class_date", date)
    .eq("start_time", start)
    .eq("status", "signed")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[withdraw] update error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });

}