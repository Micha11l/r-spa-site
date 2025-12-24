// app/api/admin/packages/redeem/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const gate = requireAdmin(req);
  if (gate.ok === false) return gate.res;

  // Parse request body
  const body = await req.json().catch(() => ({}));
  const codeRaw = String(body?.id || body?.code || "").trim();

  if (!codeRaw) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  const code = codeRaw.toLowerCase();

  // Lookup purchase based on code length
  let query;

  if (code.length >= 32) {
    // Full UUID: exact match on id
    query = supabaseAdmin
      .from("package_purchases")
      .select("*")
      .eq("id", code)
      .limit(2);
  } else {
    // Short code (8 chars): match on redeem_code
    query = supabaseAdmin
      .from("package_purchases")
      .select("*")
      .eq("redeem_code", code)
      .limit(2);
  }

  const { data, error: queryError } = await query;

  if (queryError) {
    console.error("[admin/packages/redeem] Query error:", queryError);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const rows = data || [];

  // Handle matching results
  if (rows.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (rows.length === 2) {
    // Ambiguous: multiple matches
    return NextResponse.json(
      { error: "ambiguous_code", count: rows.length },
      { status: 409 }
    );
  }

  const purchase = rows[0];

  if (purchase.is_test) {
    return NextResponse.json(
      { error: "test_purchase_not_redeemable" },
      { status: 400 },
    );
  }

  // Validation: Check if already redeemed
  if (purchase.redeemed_at || purchase.status === "redeemed") {
    return NextResponse.json(
      {
        error: "already_redeemed",
        redeemed_at: purchase.redeemed_at,
        redeemed_by: purchase.redeemed_by,
      },
      { status: 409 }
    );
  }

  // Validation: Only allow "paid" status to be redeemed
  if (purchase.status !== "paid") {
    return NextResponse.json(
      { error: "not_redeemable", status: purchase.status },
      { status: 400 }
    );
  }

  // Perform redemption
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("package_purchases")
    .update({
      status: "redeemed",
      redeemed_at: new Date().toISOString(),
      redeemed_by: null, // Fixed string since passcode admin has no email
      redeemed_by_text: "admin"
    })
    .eq("id", purchase.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error("[admin/packages/redeem] Update error:", updateError);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  console.log(`[admin/packages/redeem] Package ${purchase.id} redeemed by admin`);

  return NextResponse.json(
    {
      success: true,
      purchase: updated,
      message: "Package redeemed successfully",
    },
    { status: 200 }
  );
}
