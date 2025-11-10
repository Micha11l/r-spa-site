// app/api/gift-card/redeem/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { code, amount_cents = 0, by_email } = await req.json();
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });
  if (amount_cents <= 0) return NextResponse.json({ error: "invalid amount" }, { status: 400 });

  try {
    // 1) 取卡信息（for update）
    const { data: card, error } = await supabaseAdmin
      .from("gift_cards")
      .select("id,code,remaining_amount,status")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !card) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (card.status === "expired" || card.status === "redeemed") {
      return NextResponse.json({ error: "card not available" }, { status: 400 });
    }

    const currentRemaining = card.remaining_amount ?? 0;
    if (currentRemaining <= 0) {
      return NextResponse.json({ error: "card has no balance" }, { status: 400 });
    }

    const left = Math.max(0, currentRemaining - amount_cents);

    // 2) 记录 redemption（第一步事务）
    const { error: insErr } = await supabaseAdmin.from("gift_redemptions").insert({
      gift_card_id: card.id,
      amount_cents,
      by_email,
    });
    if (insErr) {
      console.error("Redemption insert error:", insErr);
      return NextResponse.json({ error: insErr.message }, { status: 400 });
    }

    // 3) 更新余额+状态（第二步事务）
    const newStatus = left === 0 ? "redeemed" : (left < currentRemaining ? "partially_used" : "active");
    const patch: any = { 
      remaining_amount: left, 
      status: newStatus 
    };
    if (left === 0) {
      patch.redeemed_at = new Date().toISOString();
    }

    const { error: upErr } = await supabaseAdmin
      .from("gift_cards")
      .update(patch)
      .eq("id", card.id);

    if (upErr) {
      console.error("Gift card update error:", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    return NextResponse.json({ 
      ok: true, 
      remaining_amount: left, 
      status: newStatus 
    });
  } catch (e: any) {
    console.error("Redeem error:", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}