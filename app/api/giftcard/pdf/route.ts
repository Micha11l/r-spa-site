// app/api/giftcard/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
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
    // ✅ renderGiftPdfBuffer 现在返回 Uint8Array
    const pdfBytes = await renderGiftPdfBuffer({
      code: data.code,
      value: Math.round((data.amount ?? 0) / 100),
      recipient: data.recipient_name ?? null,
      sender: data.sender_name ?? null,
      message: data.message ?? null,
    });

    // ✅ Uint8Array 可以直接传给 NextResponse（类型兼容）
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Rejuvenessence-Gift-${code}.pdf"`,
        "Cache-Control": "no-store",
        "Content-Length": pdfBytes.length.toString(),
      },
    });
  } catch (pdfErr: any) {
    console.error("PDF generation error:", pdfErr);
    return NextResponse.json({ error: "PDF generation failed", details: pdfErr.message }, { status: 500 });
  }
}
