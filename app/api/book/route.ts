import { NextResponse } from "next/server";
import dayjs from "dayjs";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { sendBookingEmails } from "@/lib/emails";

const schema = z.object({
  service: z.string().min(2),
  date: z.string(), // YYYY-MM-DD
  time: z.string(), // HH:mm
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  notes: z.string().optional()
});

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
    const parsed = schema.parse(body);

    const duration = SERVICE_DURATIONS[parsed.service] || 60;
    const start = dayjs(`${parsed.date}T${parsed.time}:00`);
    const end = start.add(duration, "minute");
    const startISO = start.toDate().toISOString();
    const endISO = end.toDate().toISOString();

    // availability check (overlap)
    const { data: overlaps, error: ovErr } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .lte("start_ts", endISO)
      .gte("end_ts", startISO)
      .neq("status", "cancelled");

    if (ovErr) throw ovErr;
    if (overlaps && overlaps.length > 0) {
      return NextResponse.json({ error: "Selected time is no longer available. Please choose another slot." }, { status: 409 });
    }

    // insert booking as pending
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

    // notify
    await sendBookingEmails({
      service: parsed.service,
      startISO, endISO,
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      notes: parsed.notes
    });

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Request failed" }, { status: 400 });
  }
}
