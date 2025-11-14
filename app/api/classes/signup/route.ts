// app/api/classes/signup/route.ts  // 假设文件名为 route.ts，如果不是请调整
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
    // 检查是否已报名（同类型、同一天、同时间段）
    const { data: existingSame, error: existSameErr } = await supabase
      .from("class_signups")
      .select("id")
      .eq("user_id", user.id)
      .eq("class_type", class_type)
      .eq("class_date", date)
      .eq("start_time", start)
      .eq("end_time", end)
      .maybeSingle();
    if (existSameErr) {
      console.error("[classes/signup] Query same failed:", existSameErr);
      return NextResponse.json({ error: existSameErr.message }, { status: 500 });
    }
    // =======================
    // 已报名同类型 -> 撤销报名
    // =======================
    if (existingSame) {
      const { error: delErr } = await supabase
        .from("class_signups")
        .delete()
        .eq("id", existingSame.id);
      if (delErr) {
        console.error("[classes/signup][withdraw]", delErr);
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
      return NextResponse.json({ message: "Withdrawn" });
    }
    // =======================
    // 新增：检查跨类型冲突（同一天、同时间段、不同类型）
    // =======================
    const { data: existingOther, error: existOtherErr } = await supabase
      .from("class_signups")
      .select("class_type")
      .eq("user_id", user.id)
      .eq("class_date", date)
      .eq("start_time", start)
      .eq("end_time", end)
      .neq("class_type", class_type)  // 不同类型
      .maybeSingle();
    if (existOtherErr) {
      console.error("[classes/signup] Query other failed:", existOtherErr);
      return NextResponse.json({ error: existOtherErr.message }, { status: 500 });
    }
    if (existingOther) {
      return NextResponse.json({
        error: "already_signed_other",
        other_type: existingOther.class_type,
      }, { status: 409 });
    }
    // =======================
    // 检查容量（新增逻辑：确保未满员）
    // =======================
    // 先获取当前时间段的报名人数
    const { count: currentCount, error: countErr } = await supabase
      .from("class_signups")
      .select("id", { count: "exact", head: true })
      .eq("class_type", class_type)
      .eq("class_date", date)
      .eq("start_time", start)
      .eq("end_time", end);
    if (countErr) {
      console.error("[classes/signup] Count failed:", countErr);
      return NextResponse.json({ error: countErr.message }, { status: 500 });
    }
    // 获取容量（从 class_capacity 表，或默认5）
    const { data: capacityData, error: capErr } = await supabase
      .from("class_capacity")
      .select("max_capacity")
      .eq("class_type", class_type)
      .eq("class_date", date)
      .eq("start_time", start)
      .eq("end_time", end)
      .maybeSingle();
    if (capErr) {
      console.error("[classes/signup] Capacity query failed:", capErr);
      return NextResponse.json({ error: capErr.message }, { status: 500 });
    }
    const maxCapacity = capacityData?.max_capacity ?? 5;  // 默认5
    if (currentCount >= maxCapacity) {
      return NextResponse.json({ error: "class_full" }, { status: 409 });
    }
    // =======================
    // 没报名且无冲突 -> 新增报名
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