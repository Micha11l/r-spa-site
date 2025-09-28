// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SITE_NAME = "Rejuvenessence";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://rejuvenessence.org";

// ===== Meta (Next.js App Router) =====
export const metadata: Metadata = {
  // 页面 <title>：页面自定义标题 | Rejuvenessence
  title: {
    default: `${SITE_NAME} | Private Wellness Studio`,
    template: `%s | ${SITE_NAME}`,
  },

  // 站点描述（你选的第 1 条）
  description:
    "Private spa with hot tub & sauna, food & drinks bar, and advanced laser therapy devices. Open 9am–8pm in Keswick (Toronto area). Book online.",

  // 用于生成绝对 URL（OG、Sitemap 等）
  metadataBase: new URL(SITE_URL),

  // Canonical
  alternates: { canonical: "/" },

  // Open Graph / link 预览
  openGraph: {
    title: SITE_NAME,
    description:
      "Private spa with hot tub & sauna, food & drinks bar, and advanced laser therapy devices. Open 9am–8pm in Keswick (Toronto area). Book online.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_CA",
    type: "website",
    images: [
      // 如果有更合适的分享图，替换掉 /logo.jpg
      { url: "/logo.jpg", width: 1200, height: 630, alt: SITE_NAME },
    ],
  },

  // 基础 robots
  robots: {
    index: true,
    follow: true,
  },
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
    telephone: "+19054761937",
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
    <html lang="en">
      <body>
        {/* 副标题可在导航等位置体现，如需直接显示可在 Navbar 内处理 */}
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