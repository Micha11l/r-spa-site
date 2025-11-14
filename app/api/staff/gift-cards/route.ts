// app/api/staff/gift-cards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const sort = searchParams.get("sort") || "date";

    // Build query
    let query = supabaseAdmin
      .from("gift_cards")
      .select("*");

    // Search filter
    if (search) {
      query = query.or(`code.ilike.%${search}%,sender_email.ilike.%${search}%,sender_name.ilike.%${search}%,recipient_email.ilike.%${search}%,recipient_name.ilike.%${search}%,purchased_by_email.ilike.%${search}%`);
    }

    // Status filter
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // Sort
    if (sort === "date") {
      query = query.order("created_at", { ascending: false });
    } else if (sort === "amount") {
      query = query.order("amount", { ascending: false });
    }

    const { data: giftCards, error } = await query;

    if (error) {
      console.error("[staff/gift-cards] Query error:", error);
      throw error;
    }

    return NextResponse.json({
      giftCards: giftCards || [],
    });
  } catch (error: any) {
    console.error("[staff/gift-cards] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch gift cards" },
      { status: 500 }
    );
  }
}
