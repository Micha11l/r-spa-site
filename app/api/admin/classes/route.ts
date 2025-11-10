// app/api/admin/classes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const type = searchParams.get("type");

    if (!date) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }

    let q = supabaseAdmin
      .from("v_classes_admin") // ★ 改：查视图
      .select(
        "id, class_type, class_date, start_time, end_time, capacity, min_size, status, coach, room, signed_count"
      )
      .eq("class_date", date)
      .order("start_time", { ascending: true });

    if (type && type !== "all") q = q.eq("class_type", type);

    const includeEmpty = searchParams.get("includeEmpty");
    if (!includeEmpty) {
      q = q.gt("signed_count", 0);
    }

    const { data, error } = await q;
    if (error) throw error;

    // 兜底：确保数字不为 NULL
    const rows = (data ?? []).map((r) => ({
      ...r,
      capacity: r.capacity ?? 5,
      min_size: r.min_size ?? 1,
      signed_count: r.signed_count ?? 0,
    }));

    return NextResponse.json(rows, { status: 200 });
  } catch (e: any) {
    console.error("[admin/classes] error:", e);
    return NextResponse.json({ error: e?.message ?? "server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...patch } = body || {};
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("classes")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    console.error("[admin/classes PATCH] error:", e);
    return NextResponse.json({ error: e?.message ?? "server error" }, { status: 500 });
  }
}