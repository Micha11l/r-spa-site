// lib/giftcard/client-utils.ts
/**
 * Client-side utility functions
 * These don't depend on server-side modules and can be used in client components
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatCurrency(amount: string | number): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'CAD',
  }).format(numericAmount);
}

export function getDaysUntilExpiry(expiresAt: string): number {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

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