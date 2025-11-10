// app/api/giftcard/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { renderGiftPdfBuffer } from "@/lib/gift-pdf";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code")?.toUpperCase();
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("gift_cards")
    .select("code,amount,remaining_amount,recipient_name,sender_name,message")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    // 调用修复后的 renderGiftPdfBuffer 函数
    const buffer = await renderGiftPdfBuffer({
      code: data.code,
      value: Math.round((data.amount ?? 0) / 100),
      recipient: data.recipient_name ?? null,
      sender: data.sender_name ?? null,
      message: data.message ?? null,
    });

    // 确保我们有一个有效的 Buffer
    if (!Buffer.isBuffer(buffer)) {
      throw new Error("Invalid PDF buffer generated");
    }

    // 直接返回 Buffer 作为 PDF
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Rejuvenessence-Gift-${code}.pdf"`,
        "Cache-Control": "no-store",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (pdfErr: any) {
    console.error("PDF generation error:", pdfErr);
    return NextResponse.json({ error: "PDF generation failed", details: pdfErr.message }, { status: 500 });
  }
}
