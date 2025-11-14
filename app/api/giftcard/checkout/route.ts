// app/api/giftcard/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  validateGiftCardAmount,
  validateBatchSize,
  validateEmail,
  sanitizeString,
  createGiftCardMetadata,
} from "@/lib/gift-card-utils";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

type GiftCardRequest = {
  amount: number;
  recipient_email?: string;
  recipient_name?: string;
  message?: string;
  is_gift: boolean;  // 新增
};

type CheckoutRequest = {
  cards: GiftCardRequest[];
  sender_name: string;   // 改名：buyer -> sender
  sender_email: string;  // 改名：buyer -> sender
  sender_phone: string;  // 新增
};

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutRequest = await req.json();
    const { cards, sender_name, sender_email, sender_phone } = body;

    // ============================================
    // 1. Validation
    // ============================================

    // Validate sender info
    if (!sender_name?.trim()) {
      return NextResponse.json(
        { error: "Sender name is required" },
        { status: 400 }
      );
    }

    if (!sender_email || !validateEmail(sender_email)) {
      return NextResponse.json(
        { error: "Invalid sender email" },
        { status: 400 }
      );
    }

    if (!sender_phone?.trim()) {
      return NextResponse.json(
        { error: "Sender phone is required" },
        { status: 400 }
      );
    }

    // Validate batch size
    const batchValidation = validateBatchSize(cards.length);
    if (!batchValidation.valid) {
      return NextResponse.json(
        { error: batchValidation.error },
        { status: 400 }
      );
    }

    // Validate each card
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      
      // Validate amount
      const amountValidation = validateGiftCardAmount(card.amount);
      if (!amountValidation.valid) {
        return NextResponse.json(
          { error: `Card ${i + 1}: ${amountValidation.error}` },
          { status: 400 }
        );
      }

      // If it's a gift, validate recipient info
      if (card.is_gift) {
        if (!card.recipient_name?.trim()) {
          return NextResponse.json(
            { error: `Card ${i + 1}: Recipient name is required for gifts` },
            { status: 400 }
          );
        }

        if (!card.recipient_email || !validateEmail(card.recipient_email)) {
          return NextResponse.json(
            { error: `Card ${i + 1}: Invalid recipient email` },
            { status: 400 }
          );
        }
      }
    }

    // ============================================
    // 2. Sanitize inputs
    // ============================================

    const sanitizedSender = {
      name: sanitizeString(sender_name),
      email: sanitizeString(sender_email.toLowerCase()),
      phone: sanitizeString(sender_phone),
    };

    const sanitizedCards = cards.map(card => ({
      amount: Math.round(card.amount), // Ensure integer
      is_gift: Boolean(card.is_gift),
      recipient_email: card.is_gift && card.recipient_email 
        ? sanitizeString(card.recipient_email.toLowerCase()) 
        : "",
      recipient_name: card.is_gift && card.recipient_name 
        ? sanitizeString(card.recipient_name) 
        : "",
      message: card.is_gift && card.message 
        ? sanitizeString(card.message, 200) 
        : "",
    }));

    // ============================================
    // 3. Calculate total
    // ============================================

    const totalAmount = sanitizedCards.reduce((sum, card) => sum + card.amount, 0);

    // ============================================
    // 4. Create Stripe line items
    // ============================================

    // Group cards by amount for cleaner checkout
    const cardsByAmount = sanitizedCards.reduce((acc, card) => {
      if (!acc[card.amount]) {
        acc[card.amount] = 0;
      }
      acc[card.amount]++;
      return acc;
    }, {} as Record<number, number>);

    const lineItems = Object.entries(cardsByAmount).map(([amount, quantity]) => ({
      price_data: {
        currency: "cad",
        product_data: {
          name: `Gift Card - $${amount} CAD`,
          description: "Rejuvenessence Medical Spa & Wellness Gift Card",
          images: ["https://rejuvenessence.org/gift-card-image.jpg"],
        },
        unit_amount: parseInt(amount) * 100, // Convert to cents
      },
      quantity,
    }));

    // ============================================
    // 5. Create metadata with sender info
    // ============================================

    const metadata = {
      type: "gift_card",
      sender_name: sanitizedSender.name,
      sender_email: sanitizedSender.email,
      sender_phone: sanitizedSender.phone,
      card_count: sanitizedCards.length.toString(),
      ...createGiftCardMetadata(sanitizedCards),
    };

    // ============================================
    // 6. Create Stripe Checkout Session
    // ============================================

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/giftcard/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/giftcard/purchase`,
      customer_email: sanitizedSender.email,
      metadata,
      payment_intent_data: {
        metadata: {
          type: "gift_card",
          sender_email: sanitizedSender.email,
        },
      },
    });

    // ============================================
    // 7. Return checkout URL
    // ============================================

    return NextResponse.json({
      url: session.url,
      session_id: session.id,
    });

  } catch (error: any) {
    console.error("[gift card checkout] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
