// app/holiday-packages/HolidayPackagesClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type PackageCatalogItem } from "@/lib/packages.catalog";
import { Sparkles, Gift } from "lucide-react";

type Props = {
  packages: PackageCatalogItem[];
};

// Package styling configuration (matches live design)
const PACKAGE_STYLES = {
  winter_glow: {
    gradient: "from-blue-600 to-purple-600",
  },
  couples_retreat: {
    gradient: "from-pink-600 to-red-600",
  },
};

export default function HolidayPackagesClient({ packages }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Handle buy query parameter
  useEffect(() => {
    if (isCheckingAuth) return;

    const buyParam = searchParams.get("buy");
    if (!buyParam) return;

    // Check if package exists
    const pkg = packages.find((p) => p.code === buyParam);
    if (!pkg) return;

    if (isAuthenticated) {
      // Redirect to checkout
      router.push(`/packages/checkout?package=${buyParam}`);
    } else {
      // Redirect to sign-up with return URL
      const destination = `/packages/checkout?package=${buyParam}`;
      router.push(`/sign-in?redirect=${encodeURIComponent(destination)}`);
    }
  }, [isCheckingAuth, isAuthenticated, searchParams, packages, router]);

  const handlePurchaseClick = (packageCode: string) => {
    if (isAuthenticated) {
      router.push(`/packages/checkout?package=${packageCode}`);
    } else {
      const destination = `/packages/checkout?package=${packageCode}`;
      router.push(`/sign-in?redirect=${encodeURIComponent(destination)}`);
    }
  };

  return (
    <>
      {/* Hero Section - matches live design */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-white/20">
            <Sparkles className="h-32 w-32" />
          </div>
          <div className="absolute bottom-10 right-10 text-white/20">
            <Gift className="h-40 w-40" />
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">Limited Time Offer</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Holiday Packages
          </h1>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Exclusive seasonal wellness packages designed for ultimate
            relaxation. The perfect gift for yourself or your loved ones.
          </p>
        </div>
      </div>

      {/* Packages Grid - matches live design */}
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {packages.map((pkg) => {
            const style = PACKAGE_STYLES[pkg.code as keyof typeof PACKAGE_STYLES];

            return (
              <div
                key={pkg.code}
                className="group relative bg-white border-2 border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-400 transition-all duration-300"
              >
                {/* Gradient Header - matches live */}
                <div
                  className={`bg-gradient-to-r ${style.gradient} p-6 text-white relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 opacity-20">
                    <Sparkles className="h-24 w-24" />
                  </div>
                  <div className="relative">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                      {pkg.name}
                    </h2>
                    <p className="text-white/90 text-sm md:text-base">
                      {pkg.shortDesc}
                    </p>
                  </div>
                </div>

                {/* Package Content - matches live */}
                <div className="p-6 space-y-6">
                  {/* What's Included - green checkmarks */}
                  <div>
                    <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                      <Gift className="h-5 w-5 text-emerald-600" />
                      What&apos;s Included
                    </h3>
                    <ul className="space-y-2">
                      {pkg.inclusions.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-zinc-700"
                        >
                          <span className="text-emerald-600 mt-1">✓</span>
                          <span className="text-sm md:text-base">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Highlights - gray italic box */}
                  {pkg.highlight && (
                    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                      <p className="text-sm text-zinc-600 italic">
                        {pkg.highlight}
                      </p>
                    </div>
                  )}

                  {/* Fine Print - small disclaimer text */}
                  {pkg.finePrint.length > 0 && (
                    <div className="text-xs text-zinc-500 space-y-1">
                      {pkg.finePrint.map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  )}

                  {/* Purchase Button - gradient style matches live */}
                  <button
                    onClick={() => handlePurchaseClick(pkg.code)}
                    disabled={isCheckingAuth}
                    className={`block w-full bg-gradient-to-r ${style.gradient} text-white text-center px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group-hover:scale-[1.02]`}
                  >
                    {isCheckingAuth ? "Loading..." : "Purchase Package"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Notice - blue-tinted card matches live */}
        <div className="mt-12 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
          <div className="flex items-start justify-center gap-3 max-w-2xl mx-auto">
            <div className="flex-shrink-0 mt-1">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-blue-900 mb-2">
                Important Information
              </h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                {isAuthenticated
                  ? "Click 'Purchase Package' to proceed with your order. After purchase, you'll receive a confirmation email with booking instructions."
                  : "Account required to purchase. Create an account or sign in to continue. After purchase, you'll receive a confirmation email with booking instructions."}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-600 mb-4">
            Have questions about our packages?
          </p>
          <a
            href="/#contact"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Contact Us
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </>
  );
}
