// app/api/book/route.ts
import customParse from "dayjs/plugin/customParseFormat";
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
dayjs.extend(customParse);

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
  service: z.enum(SERVICES),
  date: z.string().min(8),           // 允许 `2025-10-22` 或 `2025/10/22`
  time: z.string().min(4),           // HH:mm
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  notes: z.string().optional().default(""),
  company: z.string().optional(),    // 蜜罐
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

    // 规范化日期分隔符，避免用户手输带 `/` 导致解析失败
    const dateNorm = data.date.replace(/[./]/g, "-");

    // 严格解析 + 转目标时区
    const parsed = dayjs(`${dateNorm} ${data.time}`, "YYYY-MM-DD HH:mm", true);
    const startLocal = dayjs.tz(parsed, TZ);
    
    if (!startLocal.isValid()) {
      return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });
    }


    const minutes = DURATIONS[data.service] ?? 60;
    const endLocal = startLocal.add(minutes, "minute");

    // 用 UTC ISO 与数据库 timestamptz 对齐
    const startISO = startLocal.utc().toISOString();
    const endISO = endLocal.utc().toISOString();

    // === 二次校验：是否与已存在预约重叠（不包含已取消）===
    // 条件：start_at < endISO AND end_at > startISO （等边界可相邻，不算冲突）
    const { count: overlapCount, error: overlapErr } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .lt("start_at", endISO)
      .gt("end_at", startISO)
      .neq("status", "cancelled");

    if (overlapErr) {
      console.error("[/api/book] overlap check error:", overlapErr);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
    if ((overlapCount ?? 0) > 0) {
      // 返回 409，前端显示“该时段刚被占用”
      return NextResponse.json(
        { error: "time_taken" },
        { status: 409 }
      );
    }

    // === 插入 ===
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
      console.error("[/api/book] insert error:", dbErr);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    // 邮件（失败不影响下单）
    try {
      await sendBookingEmails({
        service: data.service,
        startISO,
        endISO,
        name: data.name,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
      });
    } catch (e) {
      console.error("[/api/book] email error:", e);
    }

    return NextResponse.json({ ok: true, id: rows?.id });
  } catch (e: any) {
    console.error("[/api/book] error:", e);
    const msg = e?.issues ? JSON.stringify(e.issues) : e?.message || "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}