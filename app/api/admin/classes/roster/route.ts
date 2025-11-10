// app/api/admin/classes/roster/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function parseClassId(id: string | null) {
  if (!id) return null;
  const [class_type, class_date, start_time] = id.split("|");
  if (!class_type || !class_date || !start_time) return null;
  return { class_type, class_date, start_time };
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = parseClassId(searchParams.get("class_id"));
    if (!parsed) {
      return NextResponse.json({ error: "Invalid class_id" }, { status: 400 });
    }

    const { class_type, class_date, start_time } = parsed;

    const { data, error } = await supabaseAdmin
      .from("class_signups")
      .select("id, full_name, email, status, created_at, end_time")
      .eq("class_type", class_type)
      .eq("class_date", class_date)
      .eq("start_time", start_time)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // 补上 class 信息（用第一条构造；end_time 没有就置空）
    const end_time = data?.[0]?.end_time ?? "00:00:00";

    return NextResponse.json({
      class: {
        id: `${class_type}|${class_date}|${start_time}`,
        class_type,
        class_date,
        start_time,
        end_time,
        capacity: Number(process.env.CLASSES_DEFAULT_CAPACITY ?? 5),
        min_size: Number(process.env.CLASSES_DEFAULT_MIN_SIZE ?? 5),
        status: "scheduled",
      },
      roster: (data ?? []).map((r) => ({
        id: r.id,
        full_name: r.full_name,
        email: r.email,
        status: r.status,
        created_at: r.created_at,
      })),
    });
  } catch (e: any) {
    console.error("[admin/classes/roster] GET error:", e);
    return NextResponse.json({ error: e.message || "server error" }, { status: 500 });
  }
}