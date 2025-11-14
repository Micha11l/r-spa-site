// lib/gift-card-utils.ts
import crypto from "crypto";

/**
 * Generate a unique gift card code
 * Format: RJ-XXXX-XXXX (where X is alphanumeric, excluding similar characters)
 */
export function generateGiftCardCode(): string {
  // Use chars that are easy to read (exclude 0, O, I, l, 1)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  
  const randomChars = (length: number): string => {
    let result = "";
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  };
  
  const part1 = randomChars(4);
  const part2 = randomChars(4);
  
  return `RJ-${part1}-${part2}`;
}

/**
 * Generate a secure redeem token
 * Returns a 32-character hex string (128 bits)
 */
export function generateRedeemToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Hash a redeem token for storage
 * Use SHA-256 for one-way hashing
 */
export function hashRedeemToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Verify a redeem token against a hash
 */
export function verifyRedeemToken(token: string, hash: string): boolean {
  return hashRedeemToken(token) === hash;
}

/**
 * Calculate expiration date (2 years from now)
 */
export function calculateExpiryDate(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 2);
  return date;
}

/**
 * Calculate token expiration (48 hours from now)
 */
export function calculateTokenExpiry(): Date {
  const date = new Date();
  date.setHours(date.getHours() + 48);
  return date;
}

/**
 * Check if a gift card has expired
 */
export function isGiftCardExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false; // No expiry date = never expires
  return new Date(expiresAt) < new Date();
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) return true; // No expiry date = expired
  return new Date(tokenExpiresAt) < new Date();
}

/**
 * Format amount in cents to dollars
 */
export function formatAmount(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Parse dollar amount to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Validate gift card code format
 */
export function validateGiftCardCode(code: string): boolean {
  const pattern = /^RJ-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(code);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/**
 * Generate redeem URL
 */
export function generateRedeemUrl(token: string, baseUrl: string = "https://rejuvenessence.org"): string {
  return `${baseUrl}/redeem/${token}`;
}

/**
 * Validate gift card amount
 * Minimum $1, maximum $10,000
 */
export function validateGiftCardAmount(amount: number): { valid: boolean; error?: string } {
  if (amount < 1) {
    return { valid: false, error: "Minimum gift card amount is $1" };
  }
  if (amount > 10000) {
    return { valid: false, error: "Maximum gift card amount is $10,000" };
  }
  if (!Number.isInteger(amount)) {
    return { valid: false, error: "Amount must be a whole number" };
  }
  return { valid: true };
}

/**
 * Validate batch purchase
 * Maximum 50 cards per purchase
 */
export function validateBatchSize(count: number): { valid: boolean; error?: string } {
  if (count < 1) {
    return { valid: false, error: "Must purchase at least 1 gift card" };
  }
  if (count > 50) {
    return { valid: false, error: "Maximum 50 gift cards per purchase" };
  }
  return { valid: true };
}

/**
 * Calculate total for batch purchase
 */
export function calculateBatchTotal(cards: Array<{ amount: number }>): number {
  return cards.reduce((sum, card) => sum + card.amount, 0);
}

/**
 * Generate a friendly error message
 */
export function getGiftCardErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "not_found": "Gift card not found. Please check the code and try again.",
    "expired": "This gift card has expired.",
    "already_redeemed": "This gift card has already been redeemed.",
    "insufficient_balance": "Insufficient gift card balance.",
    "invalid_code": "Invalid gift card code format.",
    "token_expired": "This redeem link has expired. Please request a new one.",
    "email_mismatch": "The email address doesn't match the gift card recipient.",
  };
  
  return messages[code] || "An error occurred. Please try again.";
}

/**
 * Sanitize user input
 */
export function sanitizeString(input: string, maxLength: number = 200): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ""); // Remove potential HTML tags
}

/**
 * Generate gift card metadata for Stripe
 */
export function createGiftCardMetadata(cards: Array<{
  amount: number;
  recipient_email?: string;
  recipient_name?: string;
  sender_name?: string;
  message?: string;
  is_gift?: boolean;
}>) {
  return {
    type: "gift_card",
    count: cards.length.toString(),
    total_amount: calculateBatchTotal(cards).toString(),
    cards: JSON.stringify(cards.map(card => ({
      amount: card.amount,
      recipient_email: card.recipient_email || "",
      recipient_name: card.recipient_name || "",
      sender_name: card.sender_name || "",
      message: card.message || "",
      is_gift: Boolean(card.is_gift),
    }))),
  };
}

/**
 * Parse gift card metadata from Stripe
 */
export function parseGiftCardMetadata(metadata: any): Array<{
  amount: number;
  recipient_email?: string;
  recipient_name?: string;
  sender_name?: string;
  message?: string;
  is_gift?: boolean;
}> | null {
  try {
    if (metadata.type !== "gift_card") return null;
    return JSON.parse(metadata.cards);
  } catch (error) {
    console.error("Failed to parse gift card metadata:", error);
    return null;
  }
}

/**
 * Rate limiting helper
 */
export function createRateLimitKey(ip: string, action: string): string {
  return `ratelimit:${action}:${ip}`;
}
