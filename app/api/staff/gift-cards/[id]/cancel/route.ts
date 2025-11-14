// app/api/staff/gift-cards/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { reason } = body;

    // Call the database function
    const { data, error } = await supabaseAdmin.rpc("cancel_gift_card", {
      p_gift_card_id: id,
      p_reason: reason || null,
    });

    if (error) {
      console.error("[staff/gift-card/cancel] Error:", error);
      throw error;
    }

    // Parse the result
    const result = typeof data === 'string' ? JSON.parse(data) : data;

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to cancel gift card" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[staff/gift-card/cancel] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel gift card" },
      { status: 500 }
    );
  }
}