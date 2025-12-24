// lib/packages.catalog.ts
// Holiday packages catalog - client-safe (no env vars, no Supabase)

// SQL for package_purchases table - run this in your database:
/*
CREATE TABLE IF NOT EXISTS package_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id UUID NOT NULL,
  package_code TEXT NOT NULL,
  is_gift BOOLEAN NOT NULL DEFAULT false,
  is_test BOOLEAN NOT NULL DEFAULT false,
  test_amount_cents INT NULL,
  recipient_name TEXT NULL,
  recipient_email TEXT NULL,
  gift_message TEXT NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'cad',
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ NULL,
  redeemed_by UUID NULL
);

CREATE INDEX IF NOT EXISTS package_purchases_buyer_idx ON package_purchases (buyer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS package_purchases_session_idx ON package_purchases (stripe_session_id);
CREATE INDEX IF NOT EXISTS package_purchases_code_idx ON package_purchases (package_code);
*/

export type PackageCatalogItem = {
  code: string;
  name: string;
  priceCents: number;
  shortDesc: string;
  inclusions: string[];
  highlight?: string; // Main highlight text shown in gray italic box
  finePrint: string[]; // Small disclaimer lines at bottom
  available: boolean;
  activeTo?: string; // ISO date string - package no longer purchasable after this date
};

export const PACKAGE_CATALOG: PackageCatalogItem[] = [
  {
    code: "winter_glow",
    name: "Winter Glow",
    priceCents: 10000, // $100
    shortDesc: "Complete relaxation experience",
    inclusions: [
      "Any 60- or 90-minute massage",
      "FREE 30 min Hot Tub OR Sauna (CA$45 value included)",
    ],
    highlight: "Perfect for deep relaxation and rejuvenation",
    finePrint: [
      "* Alcoholic beverages are available upon request, but are not included in the packages.",
    ],
    available: true,
    activeTo: "2026-01-15", // Available until mid-January 2026
  },
  {
    code: "couples_retreat",
    name: "Couples' Holiday Retreat",
    priceCents: 10000, // $100 (updated per user request)
    shortDesc: "Share the wellness together",
    inclusions: [
      "Private Hot Tub Session for Two",
      "Festive Seasonal Treats",
      "Non-Alcoholic Sparkling Beverages",
    ],
    highlight: "Create memorable moments with someone special",
    finePrint: [
      "Hot Tub maximum: 45 minutes.",
      "* Alcoholic beverages are available upon request, but are not included in the packages.",
    ],
    available: true,
    activeTo: "2026-01-15", // Available until mid-January 2026
  },
];

// Package codes as typed union
export const PACKAGE_CODES = PACKAGE_CATALOG.map((p) => p.code) as [string, ...string[]];
export type PackageCode = (typeof PACKAGE_CODES)[number];

// Helper function to get package by code
export function getPackageByCode(code: string): PackageCatalogItem | undefined {
  return PACKAGE_CATALOG.find((p) => p.code === code);
}

// Helper function to check if package is available
export function isPackageAvailable(code: string): boolean {
  const pkg = getPackageByCode(code);
  if (!pkg?.available) return false;

  // Check if package is still active (before activeTo date)
  if (pkg.activeTo) {
    const now = new Date();
    const activeToDate = new Date(pkg.activeTo);
    return now < activeToDate;
  }

  return true;
}

// Format price from cents to dollars
export function formatPackagePrice(cents: number): string {
  return `CA$${(cents / 100).toFixed(0)}`;
}
