// app/api/giftcard/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionId = new URL(req.url).searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    // 1. Retrieve the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // 2. Get the payment intent ID
    const paymentIntentId = session.payment_intent as string;

    let giftCards = [];

    // 3. Try to find gift cards by payment_intent_id first
    if (paymentIntentId) {
      const { data, error } = await supabaseAdmin
        .from("gift_cards")
        .select("code, amount, recipient_name, recipient_email")
        .eq("payment_intent_id", paymentIntentId)
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        giftCards = data;
      }
    }

    // 4. If not found, try by stripe_session_id (fallback)
    if (giftCards.length === 0) {
      console.log("[session API] Trying fallback query with session_id:", sessionId);
      
      const { data, error } = await supabaseAdmin
        .from("gift_cards")
        .select("code, amount, recipient_name, recipient_email")
        .eq("stripe_session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[session API] Fallback query error:", error);
      } else if (data && data.length > 0) {
        giftCards = data;
        console.log("[session API] Found gift cards via fallback query:", data.length);
      }
    }

    // 5. If still not found, try by session_id column (another fallback)
    if (giftCards.length === 0) {
      console.log("[session API] Trying second fallback with session_id column");
      
      const { data, error } = await supabaseAdmin
        .from("gift_cards")
        .select("code, amount, recipient_name, recipient_email")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[session API] Second fallback query error:", error);
      } else if (data && data.length > 0) {
        giftCards = data;
        console.log("[session API] Found gift cards via second fallback:", data.length);
      }
    }

    // 6. Calculate total
    const total = giftCards?.reduce((sum, card) => sum + card.amount, 0) || 0;

    console.log("[session API] Returning gift cards:", {
      count: giftCards.length,
      total,
      sessionId,
      paymentIntentId,
    });

    // 7. Return gift cards
    return NextResponse.json({
      giftCards: giftCards || [],
      total,
      session_id: sessionId,
      payment_intent_id: paymentIntentId,
    });

  } catch (error: any) {
    console.error("[session API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
