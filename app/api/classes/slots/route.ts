import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const class_date = searchParams.get("date");
  const class_type = searchParams.get("type");

  // 从请求头取 Authorization
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!class_date || !class_type) {
    return NextResponse.json({ error: "Missing date or type" }, { status: 400 });
  }

  const supabase = supabaseAdmin;

  // ========================
  // ① 获取所有报名记录
  // ========================
  const { data, error } = await supabase
    .from("class_signups")
    .select("user_id,email,start_time,end_time")
    .eq("class_type", class_type)
    .eq("class_date", class_date);

  if (error) {
    console.error("[classes/slots]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ========================
  // ② 汇总计数
  // ========================
  const counts: Record<string, number> = {};
  const toKey = (value: string | null | undefined) =>
    value ? value.slice(0, 5) : null;

  for (const r of data || []) {
    const start = toKey(r.start_time as string | null | undefined);
    const end = toKey(r.end_time as string | null | undefined);
    if (!start || !end) continue;
    const key = `${start}-${end}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  // ========================
  // ③ 当前用户报名过的时间段
  // ========================
  let mine: string[] = [];

  if (token) {
    // 注意：supabaseAdmin 没有 auth.getUser(token)
    // 因此要用 fetch 调用 Supabase Auth API 来解析 token
    const { data: userRes } = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      }
    ).then((r) => r.json().then((data) => ({ data })));

    const uid = userRes?.id;
    const email =
      typeof userRes?.email === "string"
        ? userRes.email.trim().toLowerCase()
        : undefined;

    if (uid || email) {
      mine = (data || [])
        .filter((r) => {
          const rowEmail =
            typeof r.email === "string"
              ? (r.email as string).trim().toLowerCase()
              : undefined;
          return (uid && r.user_id === uid) || (email && rowEmail === email);
        })
        .map((r) => {
          const start = toKey(r.start_time as string | null | undefined);
          const end = toKey(r.end_time as string | null | undefined);
          return start && end ? `${start}-${end}` : "";
        })
        .filter(Boolean);
    }
  }

  return NextResponse.json({ counts, mine });
}
