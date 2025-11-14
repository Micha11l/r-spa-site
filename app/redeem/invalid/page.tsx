import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Invalid Gift Card | Rejuvenessence',
  description: 'Invalid or expired gift card redemption link',
};

export default function InvalidRedemptionPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error || 'This redemption link is invalid or has expired';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        {/* Error Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 text-red-600 mb-4">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-light text-slate-900 mb-2">
            Invalid Redemption Link
          </h1>
          
          <p className="text-slate-600 mb-6">{error}</p>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-slate-900 mb-3">
            Common Reasons:
          </h2>
          
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>The gift card has already been redeemed</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>The gift card has expired</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>The redemption link is incomplete or corrupted</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>The gift card was cancelled by the purchaser</span>
            </li>
          </ul>
        </div>

        {/* Help Card */}
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-emerald-900 mb-2">
            Need Help?
          </h2>
          <p className="text-sm text-emerald-800 mb-4">
            If you believe this is an error, please contact our support team with your gift card code.
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-emerald-800">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <a
                href="mailto:support@rejuvenessence.org"
                className="hover:underline"
              >
                support@rejuvenessence.org
              </a>
            </div>
            
            <div className="flex items-center text-emerald-800">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span>(555) 123-4567</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/giftcards"
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-center font-medium"
          >
            Purchase Gift Card
          </Link>
          
          <Link
            href="/"
            className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-center font-medium"
          >
            Return Home
          </Link>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-center text-slate-500 mt-6">
          Gift cards are valid for 12 months from the date of purchase
        </p>
      </div>
    </div>
  );
}