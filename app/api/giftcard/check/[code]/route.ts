//app/api/giftcard/check/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDaysUntilExpiry, formatCurrency } from '@/lib/giftcard/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code;

    if (!code) {
      return NextResponse.json(
        { error: 'Gift card code is required' },
        { status: 400 }
      );
    }

    // Validate code format (RJ-XXXX-XXXX)
    const codeRegex = /^RJ-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!codeRegex.test(code)) {
      return NextResponse.json(
        { error: 'Invalid gift card code format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get gift card details
    const { data: giftCard, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      );
    }

    // Check if expired
    const daysUntilExpiry = getDaysUntilExpiry(giftCard.expires_at);
    const isExpired = daysUntilExpiry === 0 && new Date(giftCard.expires_at) < new Date();

    // Update status if expired but not marked as such
    if (isExpired && giftCard.status !== 'expired') {
      await supabase
        .from('gift_cards')
        .update({ status: 'expired' })
        .eq('id', giftCard.id);

      giftCard.status = 'expired';
    }

    // Get redemption details if redeemed
    let redemptionDetails = null;
    if (giftCard.status === 'redeemed') {
      const { data: redemption } = await supabase
        .from('gift_card_redemptions')
        .select('redeemed_at, redeemed_email')
        .eq('gift_card_id', giftCard.id)
        .single();

      if (redemption) {
        redemptionDetails = {
          redeemedAt: redemption.redeemed_at,
          redeemedEmail: redemption.redeemed_email,
        };
      }
    }

    // Build response
    const response = {
      code: giftCard.code,
      amount: formatCurrency(giftCard.dollars),
      amountValue: parseFloat(giftCard.dollars),
      status: giftCard.status,
      statusLabel: getStatusLabel(giftCard.status),
      purchasedAt: giftCard.purchased_at,
      expiresAt: giftCard.expires_at,
      daysUntilExpiry,
      isExpired,
      canRedeem: giftCard.status === 'active' && !isExpired,
      recipientEmail: giftCard.recipient_email,
      redemption: redemptionDetails,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking gift card:', error);
    return NextResponse.json(
      { error: 'Failed to check gift card' },
      { status: 500 }
    );
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending Activation',
    active: 'Active',
    redeemed: 'Redeemed',
    expired: 'Expired',
    cancelled: 'Cancelled',
  };

  return labels[status] || status;
}

// Optional: POST method to check with additional verification
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code;
    const body = await request.json();
    const { email } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Gift card code is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get gift card details
    const { data: giftCard, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      );
    }

    // If email provided, verify it matches recipient
    if (email && giftCard.recipient_email) {
      const normalizedRecipient = giftCard.recipient_email.toLowerCase().trim();
      const normalizedInput = email.toLowerCase().trim();

      if (normalizedRecipient !== normalizedInput) {
        return NextResponse.json(
          {
            error: 'Email does not match the gift card recipient',
            code: giftCard.code,
            amount: formatCurrency(giftCard.dollars),
          },
          { status: 403 }
        );
      }
    }

    // Return full details if verification passed
    const daysUntilExpiry = getDaysUntilExpiry(giftCard.expires_at);
    const isExpired = daysUntilExpiry === 0 && new Date(giftCard.expires_at) < new Date();

    return NextResponse.json({
      verified: true,
      code: giftCard.code,
      amount: formatCurrency(giftCard.dollars),
      amountValue: parseFloat(giftCard.dollars),
      status: giftCard.status,
      statusLabel: getStatusLabel(giftCard.status),
      expiresAt: giftCard.expires_at,
      daysUntilExpiry,
      isExpired,
      canRedeem: giftCard.status === 'active' && !isExpired,
      redemptionToken: giftCard.redemption_token,
    });
  } catch (error) {
    console.error('Error verifying gift card:', error);
    return NextResponse.json(
      { error: 'Failed to verify gift card' },
      { status: 500 }
    );
  }
}