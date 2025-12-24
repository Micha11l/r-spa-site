// app/packages/success/SuccessClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type PurchaseStatus = "loading" | "paid" | "error" | "timeout";

type Purchase = {
  id: string;
  package_code: string;
  is_gift: boolean;
  amount_cents: number;
  currency: string;
  created_at: string;
};

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<PurchaseStatus>("loading");
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Check session first
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !session.access_token) {
        // No session - redirect to sign-in
        const currentUrl = encodeURIComponent(`/packages/success?session_id=${sessionId || ""}`);
        router.push(`/sign-in?redirect=${currentUrl}`);
        return;
      }

      setAccessToken(session.access_token);
    };

    checkSession();
  }, [sessionId, router, supabase]);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    if (!accessToken) {
      // Wait for access token to be set
      return;
    }

    let attempts = 0;
    const maxAttempts = 25;
    const pollInterval = 1000; // 1 second

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/packages/purchase-status?session_id=${encodeURIComponent(sessionId)}`,
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );
        const data = await response.json();

        // Handle 401 but we have a session - show error instead of redirecting
        if (response.status === 401) {
          setStatus("error");
          return true;
        }

        if (data.status === "paid" && data.purchase) {
          setPurchase(data.purchase);
          setStatus("paid");
          return true;
        }

        if (response.status === 403) {
          setStatus("error");
          return true;
        }

        return false;
      } catch (err) {
        console.error("Poll error:", err);
        return false;
      }
    };

    const poll = async () => {
      const done = await checkStatus();
      if (done) return;

      attempts++;
      if (attempts >= maxAttempts) {
        setStatus("timeout");
        return;
      }

      setTimeout(poll, pollInterval);
    };

    poll();
  }, [sessionId, accessToken]);

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-zinc-200 rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-xl font-semibold text-zinc-900 mb-4">
            Missing Payment Information
          </h1>
          <p className="text-sm text-zinc-600 mb-6">
            We couldn&apos;t find your payment details. Please check your account to see your purchases.
          </p>
          <Link
            href="/account"
            className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white rounded-lg font-semibold hover:bg-zinc-800 transition-colors"
          >
            View My Account
          </Link>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-zinc-200 rounded-lg shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-zinc-900 mb-2">
            Processing your purchase...
          </h1>
          <p className="text-sm text-zinc-600">
            Please wait while we confirm your payment.
          </p>
        </div>
      </div>
    );
  }

  if (status === "paid" && purchase) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
          {/* Black Header */}
          <div className="bg-zinc-900 p-8 text-center text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white text-zinc-900 rounded-full mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Purchase Successful!</h1>
            <p className="text-white/80">Your holiday package has been confirmed</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            <p className="text-center text-zinc-700">
              Thank you for your purchase! You&apos;ll receive a confirmation email shortly with your package details.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white rounded-lg font-semibold hover:bg-zinc-800 transition-colors"
              >
                Book Your Appointment
              </Link>
              <Link
                href="/account"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-zinc-900 text-zinc-900 rounded-lg font-semibold hover:bg-zinc-900 hover:text-white transition-colors"
              >
                View My Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error or timeout
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-zinc-200 rounded-lg shadow-sm p-8 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 mb-4">
          {status === "error" ? "Authentication Issue" : "Confirming Your Payment"}
        </h1>
        <p className="text-sm text-zinc-600 mb-6">
          {status === "error"
            ? "Session not recognized. Please refresh the page or sign in again."
            : "We&apos;re confirming your payment. If you don&apos;t see it in your account within a few minutes, please contact support."}
        </p>
        <Link
          href="/account"
          className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white rounded-lg font-semibold hover:bg-zinc-800 transition-colors"
        >
          View My Account
        </Link>
      </div>
    </div>
  );
}
