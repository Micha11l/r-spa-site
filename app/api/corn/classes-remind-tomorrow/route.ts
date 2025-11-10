// app/api/cron/classes-remind-tomorrow/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { dayjs, TZ } from "@/lib/time";

export async function GET() {
  const tomorrow = dayjs().tz(TZ).add(1, "day").format("YYYY-MM-DD");
  const { data, error } = await supabaseAdmin
    .from("v_classes_admin")
    .select("id, class_type, class_date, start_time, end_time, signed_count")
    .eq("class_date", tomorrow)
    .gt("signed_count", 0);        // 仅有报名的班

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await Promise.all(
    (data ?? []).map((k: any) =>
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/classes/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: k.id })
      })
    )
  );
  return NextResponse.json({ ok: true, classes: (data ?? []).length });
}