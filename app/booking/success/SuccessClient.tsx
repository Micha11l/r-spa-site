// app/booking/success/SuccessClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  return (
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
          Booking request received
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 mb-8">
          We&apos;ll confirm your time by email shortly.
        </p>

        {/* Reference number if provided */}
        {ref && (
          <div className="mb-8 inline-block">
            <div className="text-xs text-zinc-500 mb-1">Reference</div>
            <div className="text-xs text-zinc-500 font-mono">{ref}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/booking"
            className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors"
          >
            Book another
          </Link>
          <Link
            href="/account"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-zinc-900 text-zinc-900 rounded-xl font-semibold hover:bg-zinc-900 hover:text-white transition-colors"
          >
            My account
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-zinc-200 text-zinc-900 rounded-xl font-semibold hover:bg-zinc-50 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
