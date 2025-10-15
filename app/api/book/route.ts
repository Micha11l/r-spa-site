// app/api/book/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import { supabaseAdmin } from "@/lib/supabase";
import { sendBookingEmails } from "@/lib/emails";
import { SERVICES, DURATIONS } from "@/lib/services";

dayjs.extend(utc);
dayjs.extend(tz);

export const runtime = "nodejs";

const TZ = process.env.TIMEZONE || "America/Toronto";

// --- 简易限流 ---
const RL_MAX = Number(process.env.RL_MAX || 5);
const WINDOW_MS = 3 * 60 * 1000;
const hits = new Map<string, number[]>();
function ratelimit(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length <= RL_MAX;
}

// --- 校验 ---
const schema = z.object({
  service: z.enum(SERVICES),          // 服务枚举
  date: z.string().min(8),            // YYYY-MM-DD
  time: z.string().min(4),            // HH:mm
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  notes: z.string().optional().default(""),
  company: z.string().optional(),     // 蜜罐
});

// --- 工具：冲突检测（与既有预约时间段相交即冲突） ---
async function hasConflict(startISO: string, endISO: string) {
  // overlap 条件：existing.start_at < newEnd && existing.end_at > newStart
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id,status")
    .lt("start_at", endISO)
    .gt("end_at", startISO)
    .neq("status", "cancelled");

  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

export async function POST(req: Request) {
  try {
    const ip =
      (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() ||
      "0.0.0.0";
    if (!ratelimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 蜜罐：被填就直接返回成功（静默丢弃）
    if (body?.company) return NextResponse.json({ ok: true });

    const data = schema.parse(body);

    // 组合开始/结束时间（时区安全）
    const start = dayjs.tz(`${data.date} ${data.time}`, "YYYY-MM-DD HH:mm", TZ);
    if (!start.isValid()) {
      return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });
    }
    const minutes = DURATIONS[data.service] ?? 60;
    const end = start.add(minutes, "minute");

    const startISO = start.toISOString();
    const endISO = end.toISOString();

    // ===== 一次校验：插入前冲突检查 =====
    if (await hasConflict(startISO, endISO)) {
      return NextResponse.json(
        {
          error: "Selected time is no longer available.",
          code: "TIME_CONFLICT",
        },
        { status: 409 }
      );
    }

    // ===== 写入（与 Admin 一致的表/字段）=====
    const { data: rows, error: dbErr } = await supabaseAdmin
      .from("bookings")
      .insert([
        {
          service_name: data.service,
          start_at: startISO,
          end_at: endISO,
          customer_name: data.name,
          customer_email: data.email,
          customer_phone: data.phone,
          notes: data.notes || null,
          status: "pending",
          // source: "website",
        },
      ])
      .select("id")
      .single();

    if (dbErr) {
      console.error("[/api/book] supabase insert error:", dbErr);
      return NextResponse.json(
        {
          error: "DB error",
          code: dbErr.code,
          message: dbErr.message,
          details: dbErr.details,
          hint: dbErr.hint,
        },
        { status: 500 }
      );
    }

    // ===== 二次兜底：插入后再查一次（极端并发下的保守校验）=====
    // 若你未来给表加了 EXCLUDE 约束，这一步可以移除。
    if (await hasConflict(startISO, endISO)) {
      // 理论上不该发生；若发生，可把这条标记为 cancelled
      await supabaseAdmin
        .from("bookings")
        .update({ status: "cancelled", notes: "auto-cancelled: conflict" })
        .eq("id", rows.id);
      return NextResponse.json(
        {
          error: "Selected time just got taken. Please pick another time.",
          code: "TIME_CONFLICT_AFTER_INSERT",
        },
        { status: 409 }
      );
    }

    // 邮件（失败不影响下单）
    try {
      await sendBookingEmails({
        service: data.service,
        startISO: startISO,
        endISO: endISO,
        name: data.name,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
      });
    } catch (e) {
      console.error("[/api/book] email error:", e);
    }

    return NextResponse.json({ ok: true, id: rows.id });
  } catch (e: any) {
    console.error("[/api/book] error:", e);
    const msg = e?.issues ? JSON.stringify(e.issues) : e?.message || "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}