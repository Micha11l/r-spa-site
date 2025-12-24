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

    // Call RPC to record gift card use atomically
    const { data, error } = await supabaseAdmin.rpc("record_gift_card_use", {
      p_gift_card_id: giftCardId,
      p_amount_cents: usedCents,
      p_service_name: serviceName || null,
      p_notes: notes || null,
      p_created_by: null
    });
    

    if (error) {
      console.error("[staff/gift-card/use] RPC error:", error);

      // Handle specific error cases
      if (error.message.includes("not_found")) {
        return NextResponse.json(
          { error: "not_found" },
          { status: 404 }
        );
      }
      if (error.message.includes("invalid_amount")) {
        return NextResponse.json(
          { error: "invalid_amount" },
          { status: 400 }
        );
      }
      if (error.message.includes("not_active")) {
        return NextResponse.json(
          { error: "not_active" },
          { status: 400 }
        );
      }
      if (error.message.includes("insufficient_balance")) {
        return NextResponse.json(
          { error: "insufficient_balance" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to record transaction" },
        { status: 500 }
      );
    }

    // Extract result (handle both array and single object)
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) {
      return NextResponse.json({ error: "Failed to record transaction" }, { status: 500});
    }
    // Send notification email (non-blocking)
    try {
      await sendGiftCardUseNotification({
        giftCard: {
          id: giftCardId,
          code: result.gift_card_code,
          remaining_amount: result.balance_after_cents,
          status: "active"
        },
        amountUsed: usedCents,
        newBalance: result.balance_after_cents,
        serviceName: serviceName || "Service",
      });
    } catch (emailError) {
      console.error("[staff/gift-card/use] Email error:", emailError);
      // Don't fail the request if email fails
    }

    // Return success response
    return NextResponse.json({
      success: true,
      code: result.gift_card_code,
      remaining_amount: result.balance_after_cents,
      transaction_id: result.transaction_id,
    });
  } catch (error: any) {
    console.error("[staff/gift-card/use] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record use" },
      { status: 500 }
    );
  }
}