import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const { id, status } = await req.json();
  if (!id || !["pending", "confirmed", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from("bookings").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}