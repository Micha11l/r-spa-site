// app/api/admin/clients/details/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    const { data: bookings, error } = await supabaseAdmin.rpc("admin_client_bookings", {
      p_email: normalized,
    });

    if (error) {
      console.error("[admin/clients/details] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      email: normalized,
      bookings: bookings || []
    });
  } catch (e: any) {
    console.error("[admin/clients/details] error:", e);
    return NextResponse.json({ error: e.message || "server error" }, { status: 500 });
  }
}
