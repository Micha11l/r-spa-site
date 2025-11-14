// app/api/classes/slots/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
    .select("user_id,start_time,end_time")
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
  for (const r of data || []) {
    const start = (r.start_time as string)?.slice(0, 5);
    const end = (r.end_time as string)?.slice(0, 5);
    const key = `${start}-${end}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  // ========================
  // ③ 获取动态容量（新增）
  // ========================
  // 定义所有可能的时间段
  const timeSlots = [
    { start: "06:30", end: "07:30" },
    { start: "07:30", end: "08:30" },
    { start: "08:30", end: "09:30" },
    { start: "17:30", end: "18:30" },
    { start: "18:30", end: "19:30" },
    { start: "19:30", end: "20:30" },
  ];
  // 批量获取所有时间段的容量设置
  const { data: capacityData } = await supabase
    .from("class_capacity")
    .select("start_time,end_time,max_capacity")
    .eq("class_type", class_type)
    .eq("class_date", class_date);
  // 构建容量映射
  const capacityMap: Record<string, number> = {};
  for (const cap of capacityData || []) {
    const key = `${cap.start_time}-${cap.end_time}`;
    capacityMap[key] = cap.max_capacity;
  }
  // 为每个时间段设置容量（如果没有设置则默认5）
  const capacities: Record<string, number> = {};
  for (const slot of timeSlots) {
    const key = `${slot.start}-${slot.end}`;
    capacities[key] = capacityMap[key] ?? 5; // 默认5人
  }
  // ========================
  // ④ 当前用户报名过的时间段
  // ========================
  let mine: string[] = [];
  if (token) {
    try {
      // 使用 Supabase Auth API 解析 token
      const authRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
        }
      );
      if (authRes.ok) {
        const userData = await authRes.json();
        const uid = userData?.id;
        if (uid) {
          mine = (data || [])
            .filter((r) => r.user_id === uid)
            .map(
              (r) =>
                `${(r.start_time as string)?.slice(0, 5)}-${(r.end_time as string)?.slice(0, 5)}`
            );
        }
      }
    } catch (e) {
      console.error("[classes/slots] Token validation failed:", e);
      // 继续执行，只是不返回 mine
    }
  }
  return NextResponse.json({ counts, capacities, mine });
}
