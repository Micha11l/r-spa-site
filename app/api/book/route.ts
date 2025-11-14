// app/api/book/route.ts
import customParse from "dayjs/plugin/customParseFormat";
import { NextResponse } from "next/server";
import { z } from "zod";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendBookingEmails } from "@/lib/emails";
import { SERVICES, DURATIONS } from "@/lib/services";

dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(customParse);

export const runtime = "nodejs";
const TZ = process.env.TIMEZONE || "America/Toronto";

// --- very simple rate limit ---
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

// --- schema ---
const schema = z.object({
  service: z.enum(SERVICES),
  date: z.string().min(8),            // YYYY-MM-DD 或 YYYY/MM/DD
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
    if (body?.company) return NextResponse.json({ ok: true }); // 蜜罐

    const data = schema.parse(body);

    // 允许 2025/10/22 这类格式
    const dateNorm = data.date.replace(/[./]/g, "-");

    // 严格解析到本地时区
    const startLocal = dayjs.tz(`${dateNorm} ${data.time}`, "YYYY-MM-DD HH:mm", TZ);
    if (!startLocal.isValid()) {
      return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });
    }

    const minutes = DURATIONS[data.service] ?? 60;
    const endLocal = startLocal.add(minutes, "minute");

    const startISO = startLocal.utc().toISOString();
    const endISO = endLocal.utc().toISOString();

    // 冲突检测：start_at < endISO 且 end_at > startISO (边界相邻允许)
    const { count: overlapCount, error: overlapErr } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .lt("start_at", endISO)
      .gt("end_at", startISO)
      .neq("status", "cancelled");

    if (overlapErr) {
      console.error("[/api/book] overlap check error:", overlapErr);
      return NextResponse.json(
        { error: `DB overlap error: ${overlapErr.message || overlapErr}` },
        { status: 500 }
      );
    }
    if ((overlapCount ?? 0) > 0) {
      return NextResponse.json({ error: "time_taken" }, { status: 409 });
    }

    const row = {
      service_name: data.service,
      start_at: startISO,
      end_at: endISO,
      customer_name: data.name,
      customer_email: data.email,
      customer_phone: data.phone,
      notes: data.notes || null,
      status: "pending" as const,
    };

    let ins = await supabaseAdmin
      .from("bookings")
      .insert([row])
      .select("id")
      .single();

    if (ins.error) {
      console.error("[/api/book] insert error:", ins.error);
      return NextResponse.json(
        { error: `DB insert error: ${ins.error.message || ins.error}` },
        { status: 500 }
      );
    }

    // 邮件失败不影响下单
    sendBookingEmails({
      service: data.service,
      startISO,
      endISO,
      name: data.name,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
    }).catch((e) => console.error("[/api/book] email error:", e));

    return NextResponse.json({ ok: true, id: ins.data?.id });
  } catch (e: any) {
    console.error("[/api/book] error:", e);
    const msg =
      e?.issues ? JSON.stringify(e.issues) : e?.message || "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}