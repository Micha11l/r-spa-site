// app/spa/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Spa & Massage Treatments",
  description:
    "Head, back & shoulders, full body, lymphatic drainage, and foot massage treatments. Transparent pricing in Keswick / Toronto.",
  alternates: { canonical: "/spa" },
};

function PageHeader() {
  return (
    <section className="relative">
      <div className="relative h-[38svh] sm:h-[44svh] lg:h-[52svh]">
        <Image
          src="/gallery/spa.jpg"
          alt="Spa treatments"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white">
              Spa Treatments
            </h1>
            <p className="mt-3 text-white/90">
              Classic options, tailored to the way you feel today.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const SPA_MENU = [
  {
    category: "Head Massage",
    options: [
      { mins: 45, price: 75 },
      { mins: 60, price: 100 },
      { mins: 90, price: 150 },
    ],
    desc: "Scalp-focused session with neck relief",
  },
  {
    category: "Back & Shoulders Massage",
    options: [
      { mins: 45, price: 75 },
      { mins: 60, price: 100 },
      { mins: 90, price: 150 },
    ],
    desc: "Back tension relief, posture-friendly",
  },
  {
    category: "Foot Massage",
    options: [
      { mins: 45, price: 75 },
      { mins: 60, price: 100 },
      { mins: 90, price: 150 },
    ],
    desc: "Focused foot and lower leg relaxation",
  },
  {
    category: "Full Body Massage",
    options: [
      { mins: 45, price: 75 },
      { mins: 60, price: 100 },
      { mins: 90, price: 150 },
    ],
    desc: "Slow, balanced flow for full relaxation",
  },
  {
    category: "Lymphatic Drainage Massage",
    options: [
      { mins: 60, price: 130 },
      { mins: 90, price: 160 },
    ],
    desc: "Gentle massage to support natural detoxification",
  },
];

export default function SpaPage() {
  return (
    <>
      <PageHeader />

      <section className="py-10 sm:py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <header className="mb-6 sm:mb-8">
            <div className="text-xs tracking-widest text-zinc-500 uppercase">
              Menu & Pricing
            </div>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl md:text-4xl">
              Pick your time, we’ll do the rest
            </h2>
          </header>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SPA_MENU.map((category) => (
              <div key={category.category} className="rounded-xl border p-5">
                <div className="font-medium text-lg">{category.category}</div>
                <div className="mt-2 text-sm text-zinc-600">{category.desc}</div>
                <div className="mt-4 space-y-2">
                  {category.options.map((opt) => (
                    <div
                      key={opt.mins}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-zinc-600">
                        {opt.mins} min
                      </span>
                      <span className="font-semibold text-emerald-600">
                        ${opt.price} CAD
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/booking"
              className="inline-flex items-center rounded-xl bg-black px-5 py-3 text-white hover:opacity-90"
            >
              Book a spa
            </Link>
            <Link
              href="/amenities"
              className="inline-flex items-center rounded-xl border border-black px-5 py-3 hover:bg-black/5"
            >
              Sauna & Hot Tub
            </Link>
          </div>

          <p className="mt-6 text-xs text-zinc-500">
            Services are relaxation-focused and non-diagnostic. Please inform us of sensitivities or
            conditions prior to your session.
          </p>
        </div>
      </section>
    </>
  );
}