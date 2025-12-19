// app/api/email/deposit/route.ts
import { NextResponse } from "next/server";
import { sendDepositEmail } from "@/lib/emails";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { to, name, checkoutUrl, bookingId } = body;

    if (!to || !name || !checkoutUrl || !bookingId) {
      console.error("[email/deposit] missing fields:", body);
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Send email first
    const { messageId } = await sendDepositEmail(to, name, checkoutUrl);

    // Update booking status (non-critical)
    let bookingUpdated = false;
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({ status: "awaiting_deposit" })
      .eq("id", bookingId);

    if (updateError) {
      console.warn("[email/deposit] Supabase update failed", updateError.message);
    } else {
      bookingUpdated = true;
    }

    console.log(`[email/deposit] Sent to ${to}, messageId: ${messageId}`);
    return NextResponse.json({ success: true, messageId, bookingUpdated });
  } catch (err: any) {
    console.error("[email/deposit] failed:", err);
    return NextResponse.json({ error: err.message || "Failed to send deposit email" }, { status: 500 });
  }
}
