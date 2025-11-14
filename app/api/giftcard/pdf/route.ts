// app/api/giftcard/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { renderGiftPdfBuffer } from "@/lib/gift-pdf";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code")?.toUpperCase();
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("gift_cards")
    .select("code,amount,remaining_amount,recipient_name,sender_name,message,is_gift,expires_at,purchased_at,created_at")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    // Generate PDF buffer with all required fields
    const pdfBytes = await renderGiftPdfBuffer({
      code: data.code,
      value: Math.round((data.amount ?? 0) / 100),
      recipient: data.recipient_name ?? null,
      sender: data.sender_name ?? null,
      message: data.message ?? null,
      isGift: data.is_gift ?? false,
      expiresAt: data.expires_at ?? null,
      purchasedAt: data.purchased_at ?? data.created_at ?? null,
    });

    // Validate PDF buffer
    if (!pdfBytes || !pdfBytes.length) {
      throw new Error("PDF generation returned empty buffer");
    }

    // Return PDF response
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
