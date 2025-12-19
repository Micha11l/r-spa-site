// app/api/admin/clients/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.rpc("admin_clients");

    if (error) {
      console.error("[admin/clients] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (e: any) {
    console.error("[admin/clients] error:", e);
    return NextResponse.json({ error: e.message || "server error" }, { status: 500 });
  }
}
