// app/booking/failure/FailureClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

// Error messages mapping
const ERROR_MESSAGES: Record<string, string> = {
  booking_in_past: "Cannot book in the past. Please select a future date and time.",
  time_taken: "This time is no longer available. Please choose another time.",
  time_unavailable: "This time is no longer available. Please choose another time.",
  invalid_service: "Invalid service selected. Please try again.",
  invalid_data: "Invalid booking information. Please check your details and try again.",
  generic: "Something went wrong. Please try again.",
};

export default function FailureClient() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "generic";
  const message = ERROR_MESSAGES[code] || ERROR_MESSAGES.generic;

  return (
    <div className="max-w-2xl w-full">
      <div className="bg-white border-2 border-zinc-200 rounded-2xl p-8 sm:p-12 text-center">
        {/* Error Icon */}
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
          Booking failed
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 mb-8">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/booking"
            className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors"
          >
            Try again
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-zinc-200 text-zinc-900 rounded-xl font-semibold hover:bg-zinc-50 transition-colors"
          >
            Go home
          </Link>
        </div>

        {/* Help Link */}
        <div className="mt-6">
          <a
            href="/#contact"
            className="text-sm text-zinc-600 hover:text-zinc-900 underline-offset-4 hover:underline"
          >
            Need help? Contact us →
          </a>
        </div>
      </div>
    </div>
  );
}
