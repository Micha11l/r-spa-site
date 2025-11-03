import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/classes/signup
export async function POST(req: Request) {
  try {
    const { class_type, date, start, end } = await req.json();

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
    const { data: existing, error: existErr } = await supabase
      .from("class_signups")
      .select("id")
      .eq("user_id", user.id)
      .eq("class_type", class_type)
      .eq("class_date", date)
      .eq("start_time", start)
      .eq("end_time", end)
      .maybeSingle();

    if (existErr) {
      console.error("[classes/signup] Query failed:", existErr);
      return NextResponse.json({ error: existErr.message }, { status: 500 });
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
    const { error } = await supabase.from("class_signups").insert([
      {
        user_id: user.id,
        email: user.email,
        full_name: `${user.user_metadata?.first_name ?? ""} ${user.user_metadata?.last_name ?? ""}`.trim(),
        class_type,
        class_date: date,
        start_time: start,
        end_time: end,
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
