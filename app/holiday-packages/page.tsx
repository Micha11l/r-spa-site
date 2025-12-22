// app/holiday-packages/page.tsx
import Link from "next/link";
import { Sparkles, Gift } from "lucide-react";

export const metadata = {
  title: "Holiday Packages",
  description:
    "Exclusive seasonal wellness packages - the perfect gift for yourself or loved ones.",
};

type Package = {
  id: string;
  name: string;
  tagline: string;
  includes: string[];
  highlights: string;
  gradient: string;
  queryParam: string;
};

const PACKAGES: Package[] = [
  {
    id: "winter-glow",
    name: "Winter Glow",
    tagline: "Complete relaxation experience",
    includes: [
      "Any 60- or 90-minute massage",
      "FREE 30 min Hot Tub OR Sauna (CA$45 value included)",
    ],
    highlights: "Perfect for deep relaxation and rejuvenation",
    gradient: "from-blue-600 to-purple-600",
    queryParam: "winter_glow",
  },
  {
    id: "couples-retreat",
    name: "Couples' Holiday Retreat",
    tagline: "Share the wellness together",
    includes: [
      "Private Hot Tub Session for Two",
      "Festive Seasonal Treats",
      "Non-Alcoholic Sparkling Beverages",
    ],
    highlights: "Create memorable moments with someone special",
    gradient: "from-pink-600 to-red-600",
    queryParam: "couples_retreat",
  },
];

export default function HolidayPackagesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      {/* Hero Section */}
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

      {/* Packages Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="group relative bg-white border-2 border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-400 transition-all duration-300"
            >
              {/* Gradient Header */}
              <div
                className={`bg-gradient-to-r ${pkg.gradient} p-6 text-white relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 opacity-20">
                  <Sparkles className="h-24 w-24" />
                </div>
                <div className="relative">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">
                    {pkg.name}
                  </h2>
                  <p className="text-white/90 text-sm md:text-base">
                    {pkg.tagline}
                  </p>
                </div>
              </div>

              {/* Package Content */}
              <div className="p-6 space-y-6">
                {/* What's Included */}
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                    <Gift className="h-5 w-5 text-emerald-600" />
                    What&apos;s Included
                  </h3>
                  <ul className="space-y-2">
                    {pkg.includes.map((item, index) => (
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

                {/* Highlights */}
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                  <p className="text-sm text-zinc-600 italic">
                    {pkg.highlights}
                  </p>
                </div>

                {/* Request Button */}
                <Link
                  href={`/booking?package=${pkg.queryParam}`}
                  className={`block w-full bg-gradient-to-r ${pkg.gradient} text-white text-center px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]`}
                >
                  Request This Package
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Notice */}
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
                Packages are requests and subject to availability. Final
                confirmation happens after approval and deposit payment.
                We&apos;ll contact you within 24 hours to confirm your booking
                details.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-600 mb-4">
            Have questions about our packages?
          </p>
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Contact Us
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Alcohol Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-500">
            * Alcoholic beverages are available upon request, but are not included in the packages.
          </p>
        </div>
      </div>
    </div>
  );
}
