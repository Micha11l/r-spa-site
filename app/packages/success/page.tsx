// app/packages/success/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Purchase Successful",
  description: "Your holiday package purchase is complete.",
};

export default function PackageSuccessPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white border-2 border-zinc-200 rounded-2xl p-8 sm:p-12 text-center">
          {/* Success Icon */}
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-zinc-900 text-white rounded-full">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
            Purchase Successful!
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 mb-8">
            Thank you for your purchase. We&apos;ve sent a confirmation email with your package details and next steps.
          </p>

          {/* Next Steps */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 mb-8 text-left">
            <h2 className="font-semibold text-zinc-900 mb-3 text-sm uppercase tracking-wide">
              What&apos;s Next?
            </h2>
            <ul className="space-y-2 text-sm text-zinc-700">
              <li className="flex items-start gap-2">
                <span className="text-zinc-900 mt-0.5 font-bold">1.</span>
                <span>Check your email for package details and booking instructions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-900 mt-0.5 font-bold">2.</span>
                <span>Visit your account page to view your purchased packages.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-900 mt-0.5 font-bold">3.</span>
                <span>Book your appointment at least 48 hours in advance.</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/account"
              className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors"
            >
              View My Account
            </Link>
            <Link
              href="/holiday-packages"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-zinc-900 text-zinc-900 rounded-xl font-semibold hover:bg-zinc-900 hover:text-white transition-colors"
            >
              Browse More Packages
            </Link>
          </div>

          {/* Support Link */}
          <div className="mt-8 pt-8 border-t border-zinc-200">
            <p className="text-sm text-zinc-600">
              Questions?{" "}
              <a
                href="/#contact"
                className="text-zinc-900 font-medium hover:underline"
              >
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
