// components/redeem/RedeemSuccess.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/giftcard/client-utils';

interface RedemptionData {
  giftCardId: string;
  code: string;
  amount: number;
  action: 'wallet' | 'direct';
  walletBalance?: string;
  transactionId?: string;
}

interface GiftCardData {
  code: string;
  amount: number;
}

interface RedeemSuccessProps {
  giftCard: GiftCardData;
  redemption: RedemptionData;
}

export default function RedeemSuccess({
  giftCard,
  redemption,
}: RedeemSuccessProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  const isWallet = redemption.action === 'wallet';
  
  console.log('🎁 RedeemSuccess Debug:', {
    'redemption.amount': redemption.amount,
    'giftCard.amount': giftCard.amount,
    'redemption.walletBalance': redemption.walletBalance
  });

  // 🔧 修复：正确处理金额显示
  const getAmount = () => {
    // 如果 redemption.amount 存在且大于0，直接使用（它应该已经是美元金额）
    if (redemption.amount && redemption.amount > 0) {
      console.log('💰 使用 redemption.amount:', redemption.amount);
      return formatCurrency(redemption.amount);
    }

    // 如果 giftCard.amount 存在，它是以分为单位的，需要转换
    if (giftCard.amount) {
      const cents = typeof giftCard.amount === 'number' 
        ? giftCard.amount 
        : parseInt(giftCard.amount);

        if (cents < 1000) {
          return formatCurrency(cents);
        } else {
          const dollars = cents / 100;
          return formatCurrency(dollars);
        }
    }
    if (redemption.amount && redemption.amount > 0) {
      const amount = redemption.amount;
      if (amount < 1000) {
        return formatCurrency(amount * 100);
      }
      return formatCurrency(amount);
    }
    return "$0.00";
  };

  const amount = getAmount();

  // 🔧 修复：walletBalance 应该已经是美元格式的字符串
  const walletBalance = redemption.walletBalance 
    ? formatCurrency(redemption.walletBalance)
    : amount;

  setTimeout(() => setShowConfetti(false), 3000);

  return (
    <div className="relative">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6',
                  ][Math.floor(Math.random() * 5)],
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Success Card */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-light text-slate-900 mb-2">
            Successfully Redeemed!
          </h2>
          
          <p className="text-slate-600">
            Your gift card has been redeemed successfully
          </p>
        </div>

        {/* Redemption Details */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-emerald-800 font-medium">
              Gift Card Code
            </span>
            <span className="text-lg font-mono font-medium text-emerald-900">
              {giftCard.code}
            </span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-emerald-800 font-medium">
              Amount
            </span>
            <span className="text-2xl font-light text-emerald-900">
              {amount}
            </span>
          </div>

          {isWallet && redemption.walletBalance && (
            <>
              <div className="border-t border-emerald-300 my-4"></div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-800 font-medium">
                  New Wallet Balance
                </span>
                <span className="text-2xl font-light text-emerald-900">
                  {walletBalance}
                </span>
              </div>
            </>
          )}
        </div>

        {/* What's Next */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-slate-900 mb-4">
            What&apos;s Next?
          </h3>

          {isWallet ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">
                    Your Balance is Ready
                  </h4>
                  <p className="text-sm text-slate-600">
                    The {amount} has been added to your wallet and is ready to
                    use for any booking.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">
                    Book a Service
                  </h4>
                  <p className="text-sm text-slate-600">
                    Browse our services and schedule your appointment. Your
                    wallet balance will be available at checkout.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">
                    Track Your Transactions
                  </h4>
                  <p className="text-sm text-slate-600">
                    View your wallet balance and transaction history anytime in
                    your account dashboard.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">
                    Ready to Use
                  </h4>
                  <p className="text-sm text-slate-600">
                    Your {amount} gift card credit is ready to be applied to
                    your next booking.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">
                    Choose Your Service
                  </h4>
                  <p className="text-sm text-slate-600">
                    Browse our services and book your preferred treatment. The
                    credit will be automatically applied.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/booking"
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-center font-medium flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Book Now</span>
          </Link>

          {isWallet && (
            <Link
              href="/account?tab=wallet"
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-center font-medium flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <span>View Wallet</span>
            </Link>
          )}

          <Link
            href="/"
            className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-center font-medium"
          >
            Return Home
          </Link>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Need Help?</p>
            <p>
              If you have any questions about using your gift card credit or
              booking a service, please contact us at{' '}
              <a
                href="mailto:support@rejuvenessence.org"
                className="underline hover:text-blue-900"
              >
                support@rejuvenessence.org
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* CSS for Confetti */}
      <style jsx>{`
        .confetti-container {
          position: absolute;
          top: -10px;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          opacity: 0;
          animation: confetti-fall 3s linear forwards;
        }

        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(-100px) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(600px) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
}