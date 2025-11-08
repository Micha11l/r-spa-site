import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function normalizeTime(value?: string | null) {
  if (!value) return value ?? null;
  return value.length === 5 ? `${value}:00` : value;
}

// POST /api/classes/signup
export async function POST(req: Request) {
  try {
    const { class_type, date, start, end } = await req.json();

    const normalizedStart = normalizeTime(start);
    const normalizedEnd = normalizeTime(end);

    if (!class_type || !date || !normalizedStart || !normalizedEnd) {
      return NextResponse.json({ error: "Missing class info" }, { status: 400 });
    }

    // 获取当前用户信息（来自 header token）
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No auth header" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = supabaseAdmin;

    // 验证 token -> 获取 user 信息
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser(token);

    if (userErr || !user) {
      console.error("[classes/signup] Auth failed:", userErr);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查是否已报名（同一天同时间段）
    const { data: existingByUser, error: existErrUser } = await supabase
      .from("class_signups")
      .select("id")
      .eq("user_id", user.id)
      .eq("class_type", class_type)
      .eq("class_date", date)
      .eq("start_time", normalizedStart)
      .eq("end_time", normalizedEnd)
      .maybeSingle();

    if (existErrUser) {
      console.error("[classes/signup] Query failed:", existErrUser);
      return NextResponse.json({ error: existErrUser.message }, { status: 500 });
    }

    let existing = existingByUser;

    const normalizedEmail =
      typeof user.email === "string"
        ? user.email.trim().toLowerCase()
        : null;

    if (!existing && normalizedEmail) {
      const { data: existingByEmail, error: existErrEmail } = await supabase
        .from("class_signups")
        .select("id")
        .eq("class_type", class_type)
        .eq("class_date", date)
        .eq("start_time", normalizedStart)
        .eq("end_time", normalizedEnd)
        .ilike("email", normalizedEmail)
        .maybeSingle();

      if (existErrEmail) {
        console.error("[classes/signup] Email query failed:", existErrEmail);
        return NextResponse.json({ error: existErrEmail.message }, { status: 500 });
      }

      existing = existingByEmail;
    }

    // =======================
    // 已报名 -> 撤销报名
    // =======================
    if (existing) {
      const { error: delErr } = await supabase
        .from("class_signups")
        .delete()
        .eq("id", existing.id);

      if (delErr) {
        console.error("[classes/signup][withdraw]", delErr);
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }

      return NextResponse.json({ message: "Withdrawn" });
    }

    // =======================
    // 没报名 -> 新增报名
    // =======================
    const fullName = `${user.user_metadata?.first_name ?? ""} ${
      user.user_metadata?.last_name ?? ""
    }`.trim();

    const { error } = await supabase.from("class_signups").insert([
      {
        user_id: user.id,
        email: normalizedEmail ?? user.email,
        full_name: fullName,
        class_type,
        class_date: date,
        start_time: normalizedStart,
        end_time: normalizedEnd,
      },
    ]);

    if (error) {
      console.error("[classes/signup][insert]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Signed up!" });
  } catch (err: any) {
    console.error("[classes/signup] Caught error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
