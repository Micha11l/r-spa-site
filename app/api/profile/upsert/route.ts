// app/api/profile/upsert/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().min(5),
  dob: z.string().nullable().optional(),   // "YYYY-MM-DD" | null
  street: z.string().optional(),
  city: z.string().optional(),
  postal: z.string().optional(),
  country: z.string().optional(),
  marketing_email: z.boolean().optional(),
  // ❌ 不再接收 marketing_mail
}).strip();   // ⬅️ 移除未知键，避免被传到 DB

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
    }

    const { data: u, error: uErr } = await supabaseAdmin.auth.getUser(token);
    if (uErr || !u?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const json = await req.json();
    const b = BodySchema.parse(json); // ⬅️ 这里已 strip 掉未知字段（例如 marketing_mail）

    const row = {
      id: u.user.id,
      first_name: b.first_name?.trim() || null,
      last_name: b.last_name?.trim() || null,
      phone: b.phone?.trim() || null,
      dob: b.dob ? new Date(b.dob) : null,
      street: b.street ?? null,
      city: b.city ?? null,
      postal: b.postal ?? null,
      country: b.country ?? null,
      marketing_email: b.marketing_email ?? true,
    };

    const { error: dbErr } = await supabaseAdmin
      .from("profiles")
      .upsert(row, { onConflict: "id" })
      .select("id")
      .single();

    if (dbErr) {
      console.error("[profile/upsert] DB error:", dbErr);
      return NextResponse.json(
        { error: "DB error", code: dbErr.code, message: dbErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[profile/upsert] error:", e);
    return NextResponse.json({ error: e?.message || "error" }, { status: 400 });
  }
}