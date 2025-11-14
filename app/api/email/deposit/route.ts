// app/api/email/deposit/route.ts
import { NextResponse } from "next/server";
import { sendDepositEmail } from "@/lib/emails";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, name, checkoutUrl, bookingId } = body;

    if (!to || !name || !checkoutUrl || !bookingId) {
      console.error("[email/deposit] missing fields:", body);
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await sendDepositEmail(to, name, checkoutUrl);

    // ✅ 同步更新 Supabase 状态为 awaiting_deposit
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({ status: "awaiting_deposit" })
      .eq("id", bookingId);

    if (updateError) {
      console.warn("[email/deposit] Supabase update failed", updateError.message);
    }

    console.log(`[email/deposit] Sent to ${to}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[email/deposit] failed:", err);
    return NextResponse.json({ error: "Failed to send deposit email" }, { status: 500 });
  }
}
