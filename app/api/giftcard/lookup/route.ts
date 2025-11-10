import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session_id = new URL(req.url).searchParams.get("session_id");
  if (!session_id) return NextResponse.json({ error: "missing" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("gift_cards").select("code,amount,remaining_amount,status").eq("stripe_session_id", session_id).single();
  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}