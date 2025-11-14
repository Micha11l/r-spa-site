// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import Hero from "@/components/Hero";
import Gallery from "@/components/Gallery";
import Section from "@/components/Section";
import Split from "@/components/Split";

const LICENSES = [
  "/licenses/1.jpg",
  "/licenses/2.jpg",
  "/licenses/3.jpg",
  "/licenses/4.jpg",
  "/licenses/5.jpg",
  "/licenses/6.jpg",
];

export default function HomePage() {
  return (
    <>
      <Hero />


      <Section>
          <Split
            image="/licenses/1.jpg" // 先用第一张做预览图，可随时换
            title="Licensed • Insured • Professional"
            desc="Seqex is licensed by Health Canada (Class II). View our certifications and compliance details."
            cta={{ href: "/licenses", label: "View certificates" }} // 跳转新页面
            // flip 可按喜好调整，false=图左文右；true=图右文左
            flip={false}
          />
      </Section>

      {/* 图片自动轮播 */}
      <Section eyebrow="Gallery" title="A calm space for your time">
        <Gallery
          images={[
            "/gallery/1.jpg",
            "/gallery/2.jpg",
            "/gallery/3.jpg",
            "/gallery/4.jpg",
            "/gallery/5.jpg",
            "/gallery/6.jpg",
            "/gallery/7.jpg",
            "/gallery/8.jpg",
            "/gallery/9.jpg",
            "/gallery/10.jpg",
            "/gallery/11.jpg",
            "/gallery/12.jpg",
            "/gallery/13.jpg",
            "/gallery/14.jpg",

          ]}
          auto
          interval={4500}
          aspect={16/9} //或 4/3， 1
        />
      </Section>

      {/* 图 + 文：Seqex / 光疗 */}
      <Section>
        <Split
          image="/gallery/seqex.jpg"
          title="Seqex & Plasma Light Therapies"
          desc="Modern devices including Seqex sessions, plasma lights (RX1/RX6), Vitamin-D UVB and more."
          cta={{ href: "/learn-more", label: "Learn more" }}
        />
      </Section>

      {/* 图 + 文：Spa */}
      <Section>
        <Split
          image="/gallery/spa.jpg"
          title="Spa Treatments"
          desc="Head, back & shoulders, full body and hot stone — popular choices tailored to your time."
          cta={{ href: "/spa", label: "View spa menu" }}
          flip
        />
      </Section>

      {/* 图 + 文：Sauna & Hot Tub */}
      <Section>
        <Split
          image="/gallery/amenities.jpg"
          title="Sauna & Hot Tub"
          desc="Heat, cold and soak — great before or after your session."
          cta={{ href: "/amenities", label: "See details" }}
        />
      </Section>

      {/* CTA */}
      <Section>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/booking"
            className="inline-flex items-center rounded-xl bg-black px-5 py-3 text-white hover:opacity-90"
          >
            Book now
          </Link>
          <Link
            href="/giftcard/purchase"
            className="inline-flex items-center rounded-xl bg-purple-600 px-5 py-3 text-white hover:opacity-90"
          >
            🎁 Gift Cards
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center rounded-xl border border-black px-5 py-3 hover:bg-black/5"
          >
            Private events & parties
          </Link>
        </div>
      </Section>
    </>
  );
}