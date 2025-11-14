// app/api/staff/gift-cards/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get gift card
    const { data: giftCard, error: cardError } = await supabaseAdmin
      .from("gift_cards")
      .select("*")
      .eq("id", id)
      .single();

    if (cardError) {
      console.error("[staff/gift-card/detail] Card error:", cardError);
      throw new Error("Gift card not found");
    }

    // Get transactions
    const { data: transactions, error: txError } = await supabaseAdmin
      .from("gift_card_transactions")
      .select("*")
      .eq("gift_card_id", id)
      .order("created_at", { ascending: false });

    if (txError) {
      console.error("[staff/gift-card/detail] Transactions error:", txError);
    }

    return NextResponse.json({
      ...giftCard,
      transactions: transactions || [],
    });
  } catch (error: any) {
    console.error("[staff/gift-card/detail] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch gift card" },
      { status: 500 }
    );
  }
}