import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });

  try {
    const { data, error } = await supabaseAdmin
      .from("gift_cards")
      .select("code,amount,remaining_amount,status,created_at,sender_name,recipient_name,message")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "not found", valid: false }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      card: {
        code: data.code,
        amount: data.amount,
        remaining_amount: data.remaining_amount,
        status: data.status,
        created_at: data.created_at,
        sender_name: data.sender_name,
        recipient_name: data.recipient_name,
        message: data.message,
      },
    });
  } catch (e: any) {
    console.error("Gift card verify error:", e);
    return NextResponse.json({ error: "server error", valid: false }, { status: 500 });
  }
}

