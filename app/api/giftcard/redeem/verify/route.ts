//app/api/giftcard/redeem/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  validateRedemptionToken,
  checkEmailRegistered,
  isValidEmail,
  canRedeemGiftCard,
} from '@/lib/giftcard/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email } = body;

    // Validate input
    if (!token) {
      return NextResponse.json(
        { error: 'Redemption token is required' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Step 1: Validate redemption token
    const tokenValidation = await validateRedemptionToken(token);

    if (!tokenValidation.valid) {
      return NextResponse.json(
        { error: tokenValidation.error },
        { status: 400 }
      );
    }

    const giftCard = tokenValidation.data;

    // Step 2: Check if already redeemed
    const canRedeem = await canRedeemGiftCard(giftCard.id);

    if (!canRedeem.valid) {
      return NextResponse.json(
        { error: canRedeem.error },
        { status: 400 }
      );
    }

    // Step 3: Check if email matches recipient (if specified)
    if (giftCard.recipientEmail) {
      const normalizedRecipient = giftCard.recipientEmail.toLowerCase().trim();
      const normalizedInput = email.toLowerCase().trim();

      if (normalizedRecipient !== normalizedInput) {
        return NextResponse.json(
          {
            error: 'This gift card was sent to a different email address',
            hint: 'Please use the email address this gift card was sent to',
          },
          { status: 403 }
        );
      }
    }

    // Step 4: Check if email is registered
    const emailCheck = await checkEmailRegistered(email);

    // Step 5: Get current user (if logged in)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Determine redeem flow
    let flow: 'direct' | 'require_login' | 'require_signup' = 'direct';
    let userId: string | undefined = undefined;

    if (emailCheck.registered) {
      if (user && user.email?.toLowerCase() === email.toLowerCase()) {
        // User is logged in with the correct email
        flow = 'direct';
        userId = user.id;
      } else {
        // Email is registered but user is not logged in or wrong account
        flow = 'require_login';
      }
    } else {
      // Email is not registered
      flow = 'require_signup';
    }

    // Return verification result
    return NextResponse.json({
      valid: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        amount: giftCard.amount,
        expiresAt: giftCard.expiresAt,
      },
      flow,
      userId,
      email,
      message: getFlowMessage(flow),
    });
  } catch (error) {
    console.error('Error in verify API:', error);
    return NextResponse.json(
      { error: 'Failed to verify redemption' },
      { status: 500 }
    );
  }
}

function getFlowMessage(flow: string): string {
  switch (flow) {
    case 'direct':
      return 'Ready to redeem! Choose how you want to use your gift card.';
    case 'require_login':
      return 'Please log in to your account to redeem this gift card.';
    case 'require_signup':
      return 'Create an account to redeem your gift card and track your balance.';
    default:
      return 'Ready to redeem your gift card!';
  }
}

// Rate limiting helper (simple in-memory, for production use Redis)
const attemptTracker = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, maxAttempts = 5): boolean {
  const now = Date.now();
  const key = identifier;

  const existing = attemptTracker.get(key);

  if (existing) {
    if (now > existing.resetAt) {
      // Reset window
      attemptTracker.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
      return true;
    }

    if (existing.count >= maxAttempts) {
      return false;
    }

    existing.count++;
    return true;
  }

  attemptTracker.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
  return true;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of attemptTracker.entries()) {
    if (now > value.resetAt) {
      attemptTracker.delete(key);
    }
  }
}, 5 * 60 * 1000);