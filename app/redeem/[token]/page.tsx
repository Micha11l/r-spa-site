//app/redeem/[token]/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import RedeemFlow from '@/components/redeem/RedeemFlow';
import { validateRedemptionToken } from '@/lib/giftcard/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Redeem Gift Card | Rejuvenessence',
  description: 'Redeem your Rejuvenessence gift card',
};

interface RedeemPageProps {
  params: {
    token: string;
  };
}

export default async function RedeemPage({ params }: RedeemPageProps) {
  const { token } = params;

  // Server-side validation
  const validation = await validateRedemptionToken(token);

  // If token is invalid, redirect to error page
  if (!validation.valid) {
    redirect(`/redeem/invalid?error=${encodeURIComponent(validation.error || 'Invalid redemption link')}`);
  }

  const giftCard = validation.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-light tracking-tight text-slate-900">
              Rejuvenessence
            </h1>
            <div className="text-sm text-slate-600">
              Gift Card Redemption
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-light text-slate-900 mb-2">
              You&apos;ve Received a Gift Card!
            </h2>
            <p className="text-slate-600">
              Follow the steps below to redeem your gift card
            </p>
          </div>

          {/* Redemption Flow */}
          <RedeemFlow
            token={token}
            initialGiftCard={{
              id: giftCard.id,
              code: giftCard.code,
              amount: giftCard.amount,
              expiresAt: giftCard.expiresAt,
              recipientEmail: giftCard.recipientEmail,
            }}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-slate-200 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-slate-600">
            <p>Need help? Contact us at support@rejuvenessence.org</p>
            <p className="mt-2 text-xs text-slate-500">
              © {new Date().getFullYear()} Rejuvenessence. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Generate static params for common routes (optional)
export async function generateStaticParams() {
  // Return empty array as tokens are dynamic
  return [];
}