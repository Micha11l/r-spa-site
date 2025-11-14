// app/api/staff/gift-cards/[id]/use/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatUSDToCents } from "@/lib/types/gift-card";
import { sendGiftCardUseNotification } from "@/lib/emails";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { amount, serviceName, notes } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const amountCents = formatUSDToCents(amount);

    // Call the database function
    const { data, error } = await supabaseAdmin.rpc("record_gift_card_use", {
      p_gift_card_id: id,
      p_amount_cents: amountCents,
      p_service_name: serviceName || null,
      p_notes: notes || null,
    });

    if (error) {
      console.error("[staff/gift-card/use] Error:", error);
      throw error;
    }

    // Parse the result
    const result = typeof data === 'string' ? JSON.parse(data) : data;

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to record use" },
        { status: 400 }
      );
    }

    // Send notification email
    try {
      const { data: giftCard } = await supabaseAdmin
        .from("gift_cards")
        .select("*")
        .eq("id", id)
        .single();

      if (giftCard) {
        await sendGiftCardUseNotification({
          giftCard,
          amountUsed: amountCents,
          newBalance: result.new_balance,
          serviceName: serviceName || "Service",
        });
      }
    } catch (emailError) {
      console.error("[staff/gift-card/use] Email error:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[staff/gift-card/use] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record use" },
      { status: 500 }
    );
  }
}