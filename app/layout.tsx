// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Playfair_Display, Manrope } from "next/font/google";

// 高级标题用 Playfair，正文用 Manrope
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });

const SITE_NAME = "Rejuvenessence";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://rejuvenessence.org";

// ===== Meta (Next.js App Router) =====
export const metadata: Metadata = {
  // 统一去掉 “Private/Wellness”，默认标题直接体现地区信息
  title: {
    default: `${SITE_NAME} — Spa in Keswick / Toronto`,
    template: `%s | ${SITE_NAME}`,
  },

  // 你选的 #1 描述，精简到搜索摘要友好长度
  description:
    "Minimalist, high-end spa in Keswick/Toronto. Hydrotherapy (Hot Tub & Sauna), classic massages, and modern light therapies such as Seqex & plasma lights.",

  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },

  openGraph: {
    title: SITE_NAME,
    description:
      "Minimalist, high-end spa in Keswick/Toronto. Hydrotherapy (Hot Tub & Sauna), classic massages, and modern light therapies such as Seqex & plasma lights.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_CA",
    type: "website",
    images: [{ url: "/logo.jpg", width: 1200, height: 630, alt: SITE_NAME }],
  },

  robots: { index: true, follow: true },
};

// ===== App Shell =====
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // JSON-LD：本地商家（DaySpa）
  const ldJson = {
    "@context": "https://schema.org",
    "@type": "DaySpa",
    name: SITE_NAME,
    url: SITE_URL,
    image: `${SITE_URL}/logo.jpg`,
    telephone: "+12892211650",
    priceRange: "$$-$$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "281 Parkwood Ave",
      addressLocality: "Keswick",
      addressRegion: "ON",
      postalCode: "L4P 2X4",
      addressCountry: "CA",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "20:00",
      },
    ],
  };

  return (
    <html lang="en" className={`${manrope.variable} ${playfair.variable}`}>
      <body className="antialiased text-zinc-900">
        <Navbar />
        <main>{children}</main>
        <Footer />

        {/* 结构化数据（SEO） */}
        <Script id="ld-localbusiness" type="application/ld+json">
          {JSON.stringify(ldJson)}
        </Script>
      </body>
    </html>
  );
}