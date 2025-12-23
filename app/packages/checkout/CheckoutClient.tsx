// app/packages/checkout/CheckoutClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getPackageByCode, formatPackagePrice, type PackageCatalogItem } from "@/lib/packages.catalog";

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pkg, setPkg] = useState<PackageCatalogItem | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication and load package
  useEffect(() => {
    const init = async () => {
      try {
        // Check auth
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setError("Please sign in to purchase packages.");
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
          return;
        }

        setIsAuthenticated(true);

        // Get package from query param
        const packageCode = searchParams.get("package");
        if (!packageCode) {
          setError("No package selected.");
          setIsCheckingAuth(false);
          return;
        }

        // Load package data
        const packageData = getPackageByCode(packageCode);
        if (!packageData) {
          setError("Package not found.");
          setIsCheckingAuth(false);
          return;
        }

        setPkg(packageData);
      } catch (e) {
        setError("An error occurred. Please try again.");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    init();
  }, [searchParams]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/sign-in?next=${returnUrl}`);
    }
  }, [isCheckingAuth, isAuthenticated, router]);

  if (isCheckingAuth) {
    return (
      <div className="text-center py-12">
        <div className="text-zinc-600">Loading...</div>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">
          {error || "Package not found"}
        </h2>
        <Link
          href="/holiday-packages"
          className="inline-flex items-center gap-2 text-zinc-900 hover:text-zinc-700 font-medium"
        >
          ← Back to Packages
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Package Summary */}
      <div className="bg-white border-2 border-zinc-200 rounded-2xl overflow-hidden">
        <div className="bg-zinc-900 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Order Summary</h2>
          <p className="text-white/80 text-sm">Review your package details</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Package Details */}
          <div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">
              {pkg.name}
            </h3>
            <p className="text-sm text-zinc-600 mb-4">{pkg.shortDesc}</p>

            <div className="space-y-2">
              <h4 className="font-semibold text-zinc-900 text-sm uppercase tracking-wide">
                Included:
              </h4>
              <ul className="space-y-1">
                {pkg.inclusions.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className="text-zinc-900 mt-0.5 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Price */}
          <div className="border-t border-zinc-200 pt-4">
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold text-zinc-900">Total:</span>
              <span className="text-2xl font-bold text-zinc-900">
                {formatPackagePrice(pkg.priceCents)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Integration Coming Soon */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-semibold text-zinc-900 mb-4">
          Payment Integration Coming Soon
        </h3>
        <p className="text-sm text-zinc-600 mb-6">
          We&apos;re currently setting up secure payment processing. Please check back soon or contact us to complete your purchase.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/holiday-packages"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-zinc-900 text-zinc-900 rounded-xl font-semibold hover:bg-zinc-900 hover:text-white transition-colors"
          >
            ← Back to Packages
          </Link>
          <button
            disabled
            className="inline-flex items-center justify-center px-6 py-3 bg-zinc-300 text-zinc-500 rounded-xl font-semibold cursor-not-allowed"
          >
            Proceed to Payment (Coming Soon)
          </button>
        </div>
      </div>

      {/* Terms */}
      {pkg.finePrint.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h4 className="font-semibold text-zinc-900 mb-3 text-sm uppercase tracking-wide">
            Terms & Conditions
          </h4>
          <ul className="space-y-2">
            {pkg.finePrint.map((item, index) => (
              <li key={index} className="text-xs text-zinc-600">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
