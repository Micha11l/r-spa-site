// app/api/staff/gift-cards/export/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Get all gift cards
    const { data: giftCards, error } = await supabaseAdmin
      .from("gift_cards")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Build CSV
    const headers = [
      "Code",
      "Amount",
      "Remaining",
      "Status",
      "Is Gift",
      "Sender Name",
      "Sender Email",
      "Sender Phone",
      "Recipient Name",
      "Recipient Email",
      "Message",
      "Purchase Date",
      "Expires",
    ];

    const rows = giftCards?.map((card) => [
      card.code,
      (card.amount / 100).toFixed(2),
      (card.remaining_amount / 100).toFixed(2),
      card.status,
      card.is_gift ? "Yes" : "No",
      card.sender_name || "",
      card.sender_email || card.purchased_by_email || "",
      card.sender_phone || "",
      card.recipient_name || "",
      card.recipient_email || "",
      card.message || "",
      new Date(card.created_at).toISOString(),
      card.expires_at ? new Date(card.expires_at).toISOString() : "",
    ]) || [];

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="gift-cards-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("[staff/gift-cards/export] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export" },
      { status: 500 }
    );
  }
}