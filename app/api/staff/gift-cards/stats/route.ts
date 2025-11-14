import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Use the view we created
    const { data: stats, error } = await supabaseAdmin
      .from("gift_card_stats")
      .select("*")
      .single();

    if (error) {
      console.error("[staff/gift-cards/stats] Error:", error);
      throw error;
    }

    return NextResponse.json(stats || {
      active_count: 0,
      partially_used_count: 0,
      used_count: 0,
      cancelled_count: 0,
      expired_count: 0,
      total_active_value: 0,
      total_remaining_value: 0,
      total_used_value: 0,
    });
  } catch (error: any) {
    console.error("[staff/gift-cards/stats] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}