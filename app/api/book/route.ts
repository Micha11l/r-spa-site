import { NextResponse } from "next/server";
import dayjs from "dayjs";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { sendBookingEmails } from "@/lib/emails";

const schema = z.object({
  service: z.string().min(2),
  date: z.string(),  // YYYY-MM-DD
  time: z.string(),  // HH:mm
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  notes: z.string().optional(),
  company: z.string().optional(), // 蜜罐字段（前端隐藏）
});

function getIP(req: Request) {
  const xff = req.headers.get("x-forwarded-for") || "";
  return xff.split(",")[0].trim() || "unknown";
}

const SERVICE_DURATIONS: Record<string, number> = {
  "Seqex Session (60m)": 60,
  "Seqex + Plasma Lights (75m)": 75,
  "Plasma Lights – Targeted (20m)": 20,
  "RX6 Full Body (40m)": 40,
  "RX1 Seat (2 x 10m)": 20,
  "Solarc Vitamin D UVB (4m)": 4,
  "Vibration + Thigh Scanner (20m)": 20
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1) 蜜罐：机器人会填这个隐藏字段
    if (body?.company) {
      return NextResponse.json({ error: "Rejected" }, { status: 400 });
    }

    // 2) 限流：同 IP 最近 1 小时超过 5 次就拒绝
    const ip = getIP(req);
    const oneHourAgoISO = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recent, error: rlErr } = await supabaseAdmin
      .from("booking_requests")
      .select("id")
      .gte("created_at", oneHourAgoISO)
      .eq("ip", ip);

    if (rlErr) throw rlErr;
    if ((recent?.length ?? 0) >= 5) {
      return NextResponse.json({ error: "Too many requests. Please try later." }, { status: 429 });
    }

    // 3) 记录本次请求
    await supabaseAdmin.from("booking_requests").insert({
      ip,
      email: body?.email || null
    });

    // 4) 校验输入
    const parsed = schema.parse(body);

    // 5) 计算起止时间
    const duration = SERVICE_DURATIONS[parsed.service] || 60;
    const start = dayjs(`${parsed.date}T${parsed.time}:00`);
    const end = start.add(duration, "minute");
    const startISO = start.toDate().toISOString();
    const endISO = end.toDate().toISOString();

    // 6) 冲突检测：已有(start < newEnd && end > newStart)
    const { data: overlaps, error: ovErr } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .lte("start_ts", endISO)
      .gte("end_ts", startISO)
      .neq("status", "cancelled");

    if (ovErr) throw ovErr;
    if ((overlaps?.length ?? 0) > 0) {
      return NextResponse.json(
        { error: "Selected time is no longer available. Please choose another slot." },
        { status: 409 }
      );
    }

    // 7) 写入预约
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        service_name: parsed.service,
        start_ts: startISO,
        end_ts: endISO,
        customer_name: parsed.name,
        customer_email: parsed.email,
        customer_phone: parsed.phone,
        notes: parsed.notes || null,
        status: "pending"
      })
      .select()
      .single();

    if (error) throw error;

    // 8) 发邮件通知
    await sendBookingEmails({
      service: parsed.service,
      startISO,
      endISO,
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      notes: parsed.notes
    });

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) {
    console.error("[/api/book] error:", e);
    return NextResponse.json({ error: e.message || "Request failed" }, { status: 400 });
  }
}