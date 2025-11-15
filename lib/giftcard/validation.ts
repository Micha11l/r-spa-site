//lib/giftcard/validation.ts
import { createClient } from '@/lib/supabase/server';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: any;
}

export interface GiftCardInfo {
  id: string;
  code: string;
  amount: number;
  status: 'active' | 'redeemed' | 'expired' | 'pending';
  purchasedAt: string;
  expiresAt: string;
  recipientEmail?: string;
  redemptionToken: string;
}

/**
 * Validate gift card redemption token
 */
export async function validateRedemptionToken(
  token: string
): Promise<ValidationResult> {
  try {
    const supabase = await createClient();

    // Query gift card by redemption token
    const { data: giftCard, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('redeem_token', token)
      .single();

    if (error || !giftCard) {
      console.log('[Redeem] Gift card not found for token:', token.substring(0, 10) + '...');
      return {
        valid: false,
        error: 'Invalid or expired redemption link',
      };
    }

    // Check if redemption token has expired (48 hours)
    if (giftCard.token_expires_at) {
      const tokenExpiresAt = new Date(giftCard.token_expires_at);
      if (tokenExpiresAt < new Date()) {
        console.log('[Redeem] Redemption token expired for code:', giftCard.code);
        return {
          valid: false,
          error: 'This redemption link has expired. Please request a new one.',
        };
      }
    }

    // Check if already redeemed
    if (giftCard.status === 'redeemed') {
      console.log('[Redeem] Gift card already redeemed:', giftCard.code);
      return {
        valid: false,
        error: 'This gift card has already been redeemed',
      };
    }

    // Check if gift card expired (2 years)
    const expiresAt = new Date(giftCard.expires_at);
    if (expiresAt < new Date()) {
      console.log('[Redeem] Gift card expired:', giftCard.code);
      // Update status to expired
      await supabase
        .from('gift_cards')
        .update({ status: 'expired' })
        .eq('id', giftCard.id);

      return {
        valid: false,
        error: 'This gift card has expired',
      };
    }

    // Check if activated
    if (giftCard.status !== 'active') {
      console.log('[Redeem] Gift card not active, status:', giftCard.status);
      return {
        valid: false,
        error: 'This gift card is not yet activated',
      };
    }

    console.log('[Redeem] Validation successful for code:', giftCard.code);
    return {
      valid: true,
      data: {
        id: giftCard.id,
        code: giftCard.code,
        amount: (giftCard.amount / 100).toString(),
        status: giftCard.status,
        purchasedAt: giftCard.purchased_at,
        expiresAt: giftCard.expires_at,
        recipientEmail: giftCard.recipient_email,
        redemptionToken: giftCard.redeem_token,
      },
    };
  } catch (error) {
    console.error('Error validating redemption token:', error);
    return {
      valid: false,
      error: 'Failed to validate gift card',
    };
  }
}

/**
 * Check if email is registered
 */
export async function checkEmailRegistered(
  email: string
): Promise<{ registered: boolean; userId?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) {
      return { registered: false };
    }

    return {
      registered: true,
      userId: data.id,
    };
  } catch (error) {
    console.error('Error checking email:', error);
    return { registered: false };
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if gift card can be redeemed
 */
export async function canRedeemGiftCard(
  giftCardId: string
): Promise<ValidationResult> {
  try {
    const supabase = await createClient();

    // Check if already redeemed
    const { data: redemption, error } = await supabase
      .from('gift_card_redemptions')
      .select('*')
      .eq('gift_card_id', giftCardId)
      .single();

    if (!error && redemption) {
      return {
        valid: false,
        error: 'This gift card has already been redeemed',
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error checking redemption status:', error);
    return {
      valid: false,
      error: 'Failed to verify redemption status',
    };
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: string | number): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'CAD',
  }).format(numericAmount);
}

/**
 * Calculate expiry days remaining
 */
export function getDaysUntilExpiry(expiresAt: string): number {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Get expiry warning message
 */
export function getExpiryWarning(expiresAt: string): string | null {
  const daysLeft = getDaysUntilExpiry(expiresAt);
  
  if (daysLeft === 0) {
    return 'Expires today!';
  } else if (daysLeft <= 7) {
    return `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
  } else if (daysLeft <= 30) {
    return `Expires in ${daysLeft} days`;
  }
  
  return null;
}