// lib/packages.catalog.ts
// Holiday packages catalog - client-safe (no env vars, no Supabase)

export type PackageCatalogItem = {
  code: string;
  name: string;
  priceCents: number;
  shortDesc: string;
  inclusions: string[];
  highlight?: string; // Main highlight text shown in gray italic box
  finePrint: string[]; // Small disclaimer lines at bottom
  available: boolean;
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
  return pkg?.available ?? false;
}

// Format price from cents to dollars
export function formatPackagePrice(cents: number): string {
  return `CA$${(cents / 100).toFixed(0)}`;
}
