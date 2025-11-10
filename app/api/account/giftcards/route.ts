import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const email = new URL(req.url).searchParams.get("email");
  if (!email) return NextResponse.json({ error: "missing email" }, { status: 400 });

  try {
    // 查询用户作为发送者或接收者的礼品卡
    // 使用两个查询然后合并，避免 SQL 注入风险
    const [senderResult, recipientResult] = await Promise.all([
      supabaseAdmin
        .from("gift_cards")
        .select("code,amount,remaining_amount,status,created_at,sender_name,recipient_name,message")
        .eq("sender_email", email),
      supabaseAdmin
        .from("gift_cards")
        .select("code,amount,remaining_amount,status,created_at,sender_name,recipient_name,message")
        .eq("recipient_email", email),
    ]);

    const senderCards = senderResult.data || [];
    const recipientCards = recipientResult.data || [];
    
    // 合并并去重（基于 code）
    const allCards = [...senderCards, ...recipientCards];
    const uniqueCards = Array.from(
      new Map(allCards.map((card) => [card.code, card])).values()
    );
    
    // 按创建时间排序
    uniqueCards.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    if (senderResult.error || recipientResult.error) {
      console.error("Gift cards query error:", senderResult.error || recipientResult.error);
      return NextResponse.json({ error: "query failed" }, { status: 500 });
    }

    return NextResponse.json({ cards: uniqueCards });
  } catch (e: any) {
    console.error("Gift cards API error:", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

