// app/api/admin/classes/remind/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.EMAIL_FROM || "Rejuvenessence <noreply@example.com>";
const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

function parseId(id: string | null) {
  if (!id) return null;
  const [class_type, class_date, start_time] = id.split("|");
  if (!class_type || !class_date || !start_time) return null;
  return { class_type, class_date, start_time };
}

export async function POST(req: NextRequest) {
  try {
    const { class_id } = await req.json();
    const p = parseId(class_id);
    if (!p) return NextResponse.json({ error: "Invalid class_id" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("class_signups")
      .select("email, full_name, end_time")
      .eq("class_type", p.class_type)
      .eq("class_date", p.class_date)
      .eq("start_time", p.start_time)
      .eq("status", "signed");

    if (error) throw error;

    const startHM = p.start_time.slice(0, 5);
    const endHM = (data?.[0]?.end_time || "00:00:00").slice(0, 5);

    let sent = 0;
    for (const r of data ?? []) {
      if (!r.email) continue;
      await resend.emails.send({
        from: FROM,
        to: r.email,
        subject: `Reminder: ${p.class_type} class on ${p.class_date} at ${startHM}`,
        html: `
          <p>Hi ${r.full_name || ""},</p>
          <p>This is a reminder for your <strong>${p.class_type}</strong> class:</p>
          <ul>
            <li><b>Date:</b> ${p.class_date}</li>
            <li><b>Time:</b> ${startHM}–${endHM}</li>
          </ul>
          <p>See you soon!<br/>— Rejuvenessence</p>
          <p><a href="${SITE_URL}/account">Manage your classes</a></p>
        `,
      });
      sent += 1;
    }

    return NextResponse.json({ sent });
  } catch (e: any) {
    console.error("[admin/classes/remind] error:", e);
    return NextResponse.json({ error: e.message || "server error" }, { status: 500 });
  }
}