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

      {/* 证照 3×2 网格（非轮播） */}
      <Section eyebrow="Compliance" title="Licensed • Insured • Professional">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
          {LICENSES.map((src, i) => (
            <div
              key={src}
              className="relative aspect-[4/3] w-full rounded-lg border bg-white"
            >
              <Image
                src={src}
                alt={`License ${i + 1}`}
                fill
                sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 400px"
                className="object-contain p-2"
                priority={i < 2}
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-zinc-500">
          Certifications and permits are available on-site upon request.
        </p>
      </Section>

      {/* 图片自动轮播（把图片放 public/gallery/1.jpg ...） */}
      <Section eyebrow="Gallery" title="A calm space for your time">
        <Gallery
          images={[
            "/gallery/1.jpeg",
            "/gallery/2.jpeg",
            "/gallery/3.jpeg",
            "/gallery/4.jpeg",
          ]}
          auto
          interval={4000}
        />
      </Section>

      {/* 图 + 文：Seqex / 光疗 */}
      <Split
        image="/gallery/seqex.jpg"
        title="Seqex & Plasma Light Therapies"
        desc="Modern devices including Seqex sessions, plasma lights (RX1/RX6), Vitamin-D UVB and more."
        cta={{ href: "/seqex", label: "Explore therapies" }}
        flip={false}
      />

      {/* 图 + 文：Spa */}
      <Split
        image="/gallery/spa.jpg"
        title="Spa Treatments"
        desc="Head, back & shoulders, full body and hot stone — popular choices tailored to your time."
        cta={{ href: "/spa", label: "View spa menu" }}
        flip
      />

      {/* 图 + 文：Sauna & Hot Tub */}
      <Split
        image="/gallery/amenities.jpg"
        title="Sauna & Hot Tub"
        desc="Heat, cold and soak — great before or after your session."
        cta={{ href: "/amenities", label: "See details" }}
        flip={false}
      />

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