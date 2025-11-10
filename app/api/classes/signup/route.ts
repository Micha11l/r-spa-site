// app/api/classes/signup/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 小班允许的类型
const ALLOWED = new Set(["stretching", "yoga", "pilates"]);

// 统一日期/时间格式
const normDate = (d: string) => d.replace(/\//g, "-");
const normTime = (t: string) => (t.length === 5 ? `${t}:00` : t);

// 每种课时长（分钟）—按需调整
const DURATION_BY_TYPE: Record<string, number> = {
  stretching: 60,
  yoga: 60,
  pilates: 60,
};

// HH:mm[:ss] 加分钟，返回 HH:mm:ss
function addMinutes(hhmm: string, mins: number) {
  const [H, M] = hhmm.slice(0, 5).split(":").map(Number);
  const d = new Date(2000, 0, 1, H, M, 0, 0);
  d.setMinutes(d.getMinutes() + mins);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}:00`;
}

export async function POST(req: Request) {
  // 认证
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: u, error: uErr } = await supabaseAdmin.auth.getUser(auth.slice(7));
  if (uErr || !u.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const email = u.user.email!;
  const user_id = u.user.id;

  // 参数
  let body: { class_type?: string; class_date?: string; start_time?: string };
  try {
    body = await req.json();
  } catch {
    body = {} as any;
  }
  const type = (body.class_type || "").toLowerCase();
  const date = body.class_date ? normDate(body.class_date) : "";
  const start = body.start_time ? normTime(body.start_time) : "";
  if (!ALLOWED.has(type) || !date || !start) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // ——同日同类型是否已报（只看 signed）
  const { count: dupCnt, error: dupErr } = await supabaseAdmin
    .from("class_signups")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .eq("class_type", type)
    .eq("class_date", date)
    .eq("status", "signed");
  if (dupErr) {
    console.error("[signup] dup check error:", dupErr);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if ((dupCnt ?? 0) > 0) {
    return NextResponse.json({ error: "already_signed_same_day" }, { status: 409 });
  }

  // ——找 classes；若没有，就自动补一条（默认 capacity=5/min_size=1，end_time 计算得到）
  const durationMin = DURATION_BY_TYPE[type] ?? 60;
  const desiredEnd = addMinutes(start, durationMin);

  let { data: cls, error: cErr } = await supabaseAdmin
    .from("classes")
    .select("id, end_time, capacity, status")
    .eq("class_type", type)
    .eq("class_date", date)
    .eq("start_time", start)
    .maybeSingle();
  if (cErr) {
    console.error("[signup] classes query error:", cErr);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  if (!cls) {
    const { data: created, error: insClassErr } = await supabaseAdmin
      .from("classes")
      .insert({
        class_type: type,
        class_date: date,
        start_time: start,
        end_time: desiredEnd, // ✅ 写入正确结束时间（不再使用 00:00:00 占位）
        capacity: 5,
        min_size: 1,
        status: "scheduled",
      })
      .select("id, end_time, capacity, status")
      .single();
    if (insClassErr) {
      console.error("[signup] create class error:", insClassErr);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    cls = created!;
  } else if (cls.end_time === "00:00:00") {
    // 老数据兜底：若历史占位值为 00:00:00，立刻修正为正确 end_time
    const { data: patched, error: patchErr } = await supabaseAdmin
      .from("classes")
      .update({ end_time: desiredEnd })
      .eq("id", cls.id)
      .select("id, end_time, capacity, status")
      .single();
    if (!patchErr && patched) cls = patched;
  }

  if (cls.status !== "scheduled") {
    return NextResponse.json({ error: "class_not_scheduled" }, { status: 409 });
  }

  // ——统计是否满员
  const { count: signedCount, error: cntErr } = await supabaseAdmin
    .from("class_signups")
    .select("*", { count: "exact", head: true })
    .eq("class_type", type)
    .eq("class_date", date)
    .eq("start_time", start)
    .eq("status", "signed");
  if (cntErr) {
    console.error("[signup] count error:", cntErr);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  const capacity = cls.capacity ?? 5;
  if ((signedCount ?? 0) >= capacity) {
    return NextResponse.json({ error: "full" }, { status: 409 });
  }

  // ——取姓名
  const { data: prof } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", user_id)
    .maybeSingle();

  // ——插入报名
  const { error: insErr } = await supabaseAdmin.from("class_signups").insert({
    user_id,
    email,
    full_name: prof?.full_name ?? null,
    class_type: type,
    class_date: date,
    start_time: start,
    end_time: cls.end_time ?? desiredEnd,
    status: "signed",
  });
  if (insErr) {
    if ((insErr as any).code === "23505") {
      return NextResponse.json({ error: "already_signed_same_day" }, { status: 409 });
    }
    console.error("[signup] insert error:", insErr);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // ——返回最新计数
  const { count: newCount } = await supabaseAdmin
    .from("class_signups")
    .select("*", { count: "exact", head: true })
    .eq("class_type", type)
    .eq("class_date", date)
    .eq("start_time", start)
    .eq("status", "signed");

  return NextResponse.json({
    ok: true,
    signed_count: newCount ?? ((signedCount ?? 0) + 1),
    capacity,
  });
}