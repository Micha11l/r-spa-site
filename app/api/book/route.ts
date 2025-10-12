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
  service: z.enum(SERVICES),          // SERVICES 要是 const 断言的元组
  date: z.string().min(8),            // YYYY-MM-DD
  time: z.string().min(4),            // HH:mm
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  notes: z.string().optional().default(""),
  company: z.string().optional(),     // 蜜罐
});

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

    // 蜜罐：被填就直接返回成功
    if (body?.company) return NextResponse.json({ ok: true });

    const data = schema.parse(body);

    // 组合开始/结束时间（时区安全）
    const start = dayjs.tz(`${data.date} ${data.time}`, "YYYY-MM-DD HH:mm", TZ);
    if (!start.isValid()) {
      return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });
    }
    const minutes = DURATIONS[data.service] ?? 60;
    const end = start.add(minutes, "minute");

    // === 写入与 Admin 一致的表/字段 ===
    const { data: rows, error: dbErr } = await supabaseAdmin
      .from("bookings")                                 // ✅ 表名
      .insert([
        {
          service_name: data.service,
          start_at: start.toISOString(),                // ✅ 列名
          end_at: end.toISOString(),                    // ✅ 列名
          customer_name: data.name,
          customer_email: data.email,
          customer_phone: data.phone,
          notes: data.notes || null,
          status: "pending",
          source: "website",
        },
      ])
      .select("id");

    if (dbErr) {
      console.error("[/api/book] supabase insert error:", dbErr);
      return NextResponse.json({ error: "DB error", code: dbErr.code, message: dbErr.message, details: dbErr.details, hint: dbErr.hint }, { status: 500 });
    }

    // 邮件（失败不影响下单）
    try {
      await sendBookingEmails({
        service: data.service,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
      });
    } catch (e) {
      console.error("[/api/book] email error:", e);
    }

    return NextResponse.json({ ok: true, id: rows?.[0]?.id });
  } catch (e: any) {
    console.error("[/api/book] error:", e);
    const msg = e?.issues ? JSON.stringify(e.issues) : e?.message || "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}