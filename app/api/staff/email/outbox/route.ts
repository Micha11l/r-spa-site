// app/api/staff/email/outbox/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    // 查询最近的邮件记录
    const { data, error } = await supabaseAdmin
      .from("email_outbox")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Math.min(limit, 100)); // 最多100条

    if (error) {
      console.error("[staff/email/outbox] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch email records" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      records: data || [],
    });
  } catch (error: any) {
    console.error("[staff/email/outbox] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
