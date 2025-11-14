'use client';

import { formatCurrency, getDaysUntilExpiry, getExpiryWarning } from '@/lib/giftcard/client-utils';

interface GiftCardDisplayProps {
  code: string;
  amount: string;
  expiresAt: string;
  status?: 'active' | 'redeemed' | 'expired';
  showExpiry?: boolean;
}

export default function GiftCardDisplay({
  code,
  amount,
  expiresAt,
  status = 'active',
  showExpiry = true,
}: GiftCardDisplayProps) {
  const formattedAmount = formatCurrency(amount);
  const daysLeft = getDaysUntilExpiry(expiresAt);
  const expiryWarning = getExpiryWarning(expiresAt);
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative">
      {/* Gift Card */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl shadow-2xl overflow-hidden">
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative p-8 md:p-10">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-white">
              <h3 className="text-sm font-medium tracking-wide uppercase opacity-90">
                Rejuvenessence
              </h3>
              <p className="text-xs opacity-75 mt-1">Gift Card</p>
            </div>

            {/* Status Badge */}
            {status !== 'active' && (
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  status === 'redeemed'
                    ? 'bg-white/20 text-white'
                    : 'bg-red-500/80 text-white'
                }`}
              >
                {status === 'redeemed' ? 'Redeemed' : 'Expired'}
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="mb-8">
            <div className="text-white/80 text-sm font-light mb-2">
              Gift Card Value
            </div>
            <div className="text-5xl md:text-6xl font-light text-white tracking-tight">
              {formattedAmount}
            </div>
          </div>

          {/* Code */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-white/80 text-xs font-medium mb-2 uppercase tracking-wide">
              Card Code
            </div>
            <div className="text-white text-xl md:text-2xl font-mono tracking-wider font-medium">
              {code}
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
        </div>
      </div>

      {/* Expiry Information */}
      {showExpiry && status === 'active' && (
        <div className="mt-4 px-4">
          {expiryWarning && daysLeft <= 30 ? (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                daysLeft <= 7
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm">
                <span className="font-medium">{expiryWarning}!</span>
                <span className="ml-1 opacity-75">
                  Redeem before {expiryDate}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-slate-50 text-slate-600 rounded-lg border border-slate-200">
              <svg
                className="w-5 h-5 flex-shrink-0"
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
              <div className="text-sm">
                <span className="opacity-75">Valid until</span>
                <span className="ml-1 font-medium">{expiryDate}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expired Message */}
      {status === 'expired' && (
        <div className="mt-4 px-4">
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="text-sm">
              <span className="font-medium">This gift card has expired</span>
              <span className="ml-1 opacity-75">on {expiryDate}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}