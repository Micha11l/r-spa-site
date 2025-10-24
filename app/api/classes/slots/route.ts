// app/api/classes/slots/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date"); // YYYY-MM-DD
  const type = url.searchParams.get("type"); // stretching | yoga | pilates
  if (!date || !type) return NextResponse.json({ error: "date & type required" }, { status: 400 });

  const tpl = [
    { start: "06:30", end: "07:30" },
    { start: "07:30", end: "08:30" },
    { start: "08:30", end: "09:30" },
    { start: "17:30", end: "18:30" },
    { start: "18:30", end: "19:30" },
    { start: "19:30", end: "20:30" },
  ];

  const { data, error } = await supabaseAdmin
    .from("class_signups")
    .select("start_time,end_time", { count: "exact" })
    .eq("class_date", date)
    .eq("class_type", type);

  if (error) {
    console.error("[/api/classes/slots]", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const counts: Record<string, number> = {};
  (data || []).forEach((r: any) => {
    const key = `${r.start_time.slice(0,5)}-${r.end_time.slice(0,5)}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  // 返回各时段人数
  return NextResponse.json({ counts });
}