// app/api/book/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import { sendBookingEmails } from "@/lib/emails";

dayjs.extend(utc);
dayjs.extend(tz);

const TZ = process.env.TIMEZONE || "America/Toronto";

// ---- 服务清单（与前端一致） ----
export const THERAPIES = [
  "Seqex Session (27m)",
  "Seqex Session – Double (58m)",
  "Seqex Personalized Test (80m)",
  "Personalized Test & Card (80m)",
  "ICR Treatment (12m)",
  "Amygdala Flush (custom)",
  "Special Treatment (custom)",
  "RX1 Seat (20m)",
  "Vitamin D UVB (4m)",
  "LifeForce (60m)",
] as const;

export const SPA = [
  "Spa – Head (45m)",
  "Spa – Back & Shoulders (60m)",
  "Spa – Full Body (90m)",
  "Spa – Hot Stone (75m)",
] as const;

export const OTHER = ["Private Event / Party (inquiry only)"] as const;

export const SERVICES = [...THERAPIES, ...SPA, ...OTHER] as const;

// ---- 每个服务的时长（分钟）----
const DURATIONS: Record<(typeof SERVICES)[number], number> = {
  // Therapies
  "Seqex Session (27m)": 27,
  "Seqex Session – Double (58m)": 58,
  "Seqex Personalized Test (80m)": 80,
  "Personalized Test & Card (80m)": 80,
  "ICR Treatment (12m)": 12,
  "Amygdala Flush (custom)": 60, // 自定义默认 60
  "Special Treatment (custom)": 60, // 自定义默认 60
  "RX1 Seat (20m)": 20,
  "Vitamin D UVB (4m)": 4,
  "LifeForce (60m)": 60,

  // Spa
  "Spa – Head (45m)": 45,
  "Spa – Back & Shoulders (60m)": 60,
  "Spa – Full Body (90m)": 90,
  "Spa – Hot Stone (75m)": 75,

  // Other
  "Private Event / Party (inquiry only)": 120, // 仅作占位
};

// ---- 简单限流（同一 IP，3 分钟内最多 RL_MAX 次）----
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

// ---- 校验 ----
const schema = z.object({
  service: z.enum(SERVICES),
  date: z.string().min(8), // YYYY-MM-DD
  time: z.string().min(4), // HH:mm
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  notes: z.string().optional().default(""),
  company: z.string().optional(), // 蜜罐
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

    // 蜜罐：若被填，直接返回成功（不发邮件）
    if (body?.company) {
      return NextResponse.json({ ok: true });
    }

    const data = schema.parse(body);

    // 组合开始/结束时间（转为指定时区）
    const start = dayjs.tz(
      `${data.date} ${data.time}`,
      "YYYY-MM-DD HH:mm",
      TZ
    );
    if (!start.isValid()) {
      return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });
    }
    const minutes = DURATIONS[data.service] ?? 60;
    const end = start.add(minutes, "minute");

    await sendBookingEmails({
      service: data.service,
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[/api/book] error:", e);
    const msg = e?.issues ? JSON.stringify(e.issues) : e?.message || "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}