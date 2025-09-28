// app/sitemap.ts
import type { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://rejuvenessence.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${baseUrl}/`,        lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/booking`,  lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${baseUrl}/faq`,      lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/policies`, lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}