// app/api/staff/gift-cards/[id]/use/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendGiftCardUseNotification } from "@/lib/emails";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const giftCardId = params.id;
    const body = await req.json();
    const { amount, serviceName, notes } = body;

    // Validate amount is a finite number > 0
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "invalid_amount" },
        { status: 400 }
      );
    }

    // Convert dollars to cents
    const usedCents = Math.round(amount * 100);

    // 1. Load the gift card first
    const { data: giftCard, error: fetchError } = await supabaseAdmin
      .from("gift_cards")
      .select("id, code, remaining_amount, status")
      .eq("id", giftCardId)
      .single();

    if (fetchError || !giftCard) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404 }
      );
    }

    // 2. Check if status is active
    if (giftCard.status !== "active") {
      return NextResponse.json(
        { error: "Gift card is not active" },
        { status: 400 }
      );
    }

    // 3. Validate usedCents <= remaining_amount
    if (usedCents > giftCard.remaining_amount) {
      return NextResponse.json(
        { error: "insufficient_balance" },
        { status: 400 }
      );
    }

    // Calculate balances
    const balanceBefore = giftCard.remaining_amount;
    const balanceAfter = balanceBefore - usedCents;

    // 4. Insert transaction with gift_card_code
    const { data: transaction, error: insertError } = await supabaseAdmin
      .from("gift_card_transactions")
      .insert({
        gift_card_id: giftCard.id,
        gift_card_code: giftCard.code, // NOT NULL - this is the key fix
        amount_cents: usedCents,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        transaction_type: "use",
        service_name: serviceName || null,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[staff/gift-card/use] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to record transaction" },
        { status: 500 }
      );
    }

    // 5. Update gift_cards.remaining_amount
    const { error: updateError } = await supabaseAdmin
      .from("gift_cards")
      .update({ remaining_amount: balanceAfter })
      .eq("id", giftCard.id);

    if (updateError) {
      console.error("[staff/gift-card/use] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update gift card balance" },
        { status: 500 }
      );
    }

    // Send notification email (non-blocking)
    try {
      await sendGiftCardUseNotification({
        giftCard: { ...giftCard, remaining_amount: balanceAfter },
        amountUsed: usedCents,
        newBalance: balanceAfter,
        serviceName: serviceName || "Service",
      });
    } catch (emailError) {
      console.error("[staff/gift-card/use] Email error:", emailError);
      // Don't fail the request if email fails
    }

    // 6. Return updated gift card and transaction id
    return NextResponse.json({
      success: true,
      code: giftCard.code,
      remaining_amount: balanceAfter,
      transaction_id: transaction.id,
    });
  } catch (error: any) {
    console.error("[staff/gift-card/use] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record use" },
      { status: 500 }
    );
  }
}