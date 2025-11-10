// app/api/admin/classes/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date")!;
    const type = searchParams.get("type"); // 可选

    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

    // 聚合：同一 (type, date, start_time, end_time)
    let sql = supabaseAdmin
      .from("class_signups")
      .select("class_type, class_date, start_time, end_time, status", { count: "exact", head: false })
      .eq("class_date", date);

    if (type) sql = sql.eq("class_type", type);

    // 直接拉出明细后在内存分组（简单可靠）
    const { data, error } = await sql;
    if (error) throw error;

    type Row = {
      class_type: string;
      class_date: string;
      start_time: string;
      end_time: string;
      status: "signed" | "withdrawn";
    };

    const map = new Map<string, { type: string; date: string; start: string; end: string; signed: number }>();

    (data as Row[]).forEach((r) => {
      const key = `${r.class_type}|${r.class_date}|${r.start_time}|${r.end_time}`;
      if (!map.has(key)) {
        map.set(key, { type: r.class_type, date: r.class_date, start: r.start_time, end: r.end_time, signed: 0 });
      }
      if (r.status === "signed") map.get(key)!.signed += 1;
    });

    // 你现在容量固定 5；需要的话可根据 type 决定
    const capacity = 5;
    const rows = [...map.values()]
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((r) => ({ ...r, capacity }));

    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "server error" }, { status: 500 });
  }
}