// app/sitemap.ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://rejuvenessence.org";
  const now = new Date().toISOString();

  return [
    // --- Public pages ---
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/services`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/bistro`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/booking`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/policies`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },

    // --- Optional pages (only if they are public) ---
    // { url: `${base}/licenses`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },

    // --- Exclude private/admin paths ---
    // Do NOT list /admin, /s/, /maintenance, etc.
  ];
}
