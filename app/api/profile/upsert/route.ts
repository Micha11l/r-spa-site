// app/api/profile/upsert/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase"; // 你的 service-role 客户端
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().min(3),
  dob: z.string().nullable().optional(), // YYYY-MM-DD | null
  street: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postal: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  marketing_email: z.boolean().optional(),
  marketing_mail: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

    // ✅ 用服务端取 token 内的用户
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const input = schema.parse(body);

    const { error: dbErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId, // 强制使用当前用户 id
          first_name: input.first_name,
          last_name: input.last_name,
          phone: input.phone,
          city: input.city ?? null,
          postal: input.postal ?? null,
          country: input.country ?? null,
          // 你表里如果有 dob/street 字段，取消注释：
          // dob: input.dob ?? null,
          // street: input.street ?? null,
          marketing_email: input.marketing_email ?? true,
          marketing_mail: input.marketing_mail ?? false,
        },
        { onConflict: "id" }
      );

    if (dbErr) {
      console.error("[profile/upsert] DB error:", dbErr);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[profile/upsert] error:", e);
    return NextResponse.json({ error: e?.message || "Error" }, { status: 400 });
  }
}