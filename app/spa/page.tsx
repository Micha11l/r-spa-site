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
        <div className="absolute inset-0 bg-black/40" />
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

const STANDARD_MASSAGES = [
  {
    title: "Head Massage",
    description: "Scalp-focused session with neck relief",
  },
  {
    title: "Back & Shoulders Massage",
    description: "Back tension relief, posture-friendly",
  },
  {
    title: "Foot Massage",
    description: "Focused foot and lower leg relaxation",
  },
  {
    title: "Full Body Massage",
    description: "Slow, balanced flow for full relaxation",
  },
] as const;

function SectionHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-8">
      <div className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase font-semibold">
        {kicker}
      </div>
      <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl text-zinc-950">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-sm sm:text-base text-zinc-600 max-w-3xl leading-relaxed">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}

function UnifiedPricingBar() {
  return (
    <div className="mb-10 rounded-2xl border border-zinc-200 bg-white">
      <div className="px-5 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-zinc-600">
            <span className="font-medium text-zinc-950">Standard Massage Pricing</span>
            <span className="hidden sm:inline"> · </span>
            <span className="block sm:inline">Pick your time, we’ll do the rest.</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span className="inline-flex items-center rounded-full border border-zinc-950 px-3 py-1 text-zinc-950 font-semibold">
              45 min <span className="ml-2 font-normal text-zinc-700">CA$75</span>
            </span>
            <span className="inline-flex items-center rounded-full border border-zinc-950 px-3 py-1 text-zinc-950 font-semibold">
              60 min <span className="ml-2 font-normal text-zinc-700">CA$100</span>
            </span>
            <span className="inline-flex items-center rounded-full border border-zinc-950 px-3 py-1 text-zinc-950 font-semibold">
              90 min <span className="ml-2 font-normal text-zinc-700">CA$150</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SpaPage() {
  return (
    <>
      <PageHeader />

      <section className="py-10 sm:py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section A */}
          <div className="mb-16">
            <SectionHeader
              kicker="Essential Care"
              title="Standard Massage"
              subtitle="Four classic options with a consistent price structure. Choose the area that matches how you feel today."
            />

            <UnifiedPricingBar />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STANDARD_MASSAGES.map((m) => (
                <div
                  key={m.title}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300"
                >
                  <h3 className="font-semibold text-base text-zinc-950">{m.title}</h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                    {m.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section B */}
          <div className="mb-16">
            <SectionHeader
              kicker="Specialized Therapy"
              title="Lymphatic Drainage"
              subtitle="A gentle, targeted technique that supports circulation and relaxation. Pricing differs from standard massage."
            />

            <div className="rounded-2xl border border-zinc-950 bg-white p-4 sm:p-6 md:p-8">
              {/* Signature badge - responsive positioning */}
              <div className="mb-4 sm:mb-0 sm:float-right sm:ml-4">
                <span className="inline-flex items-center rounded-full border border-zinc-950 px-3 py-1 text-[11px] font-semibold text-zinc-950 uppercase tracking-[0.18em] whitespace-nowrap">
                  Signature
                </span>
              </div>

              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-zinc-950 break-words leading-snug pr-0 sm:pr-4">
                  Lymphatic Drainage Massage
                </h3>
                <p className="mt-3 text-sm sm:text-base text-zinc-600 leading-relaxed break-words whitespace-normal">
                  Gentle massage to support natural detoxification and circulation.
                </p>

                <div className="mt-6 sm:mt-7 divide-y divide-zinc-200 rounded-xl border border-zinc-200 clear-both">
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-4 px-4 sm:px-5 py-3 sm:py-4 min-w-0">
                    <div className="text-sm sm:text-base text-zinc-700 min-w-0">
                      <span className="font-medium text-zinc-950 whitespace-nowrap">60 min</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-base sm:text-lg font-semibold text-zinc-950 whitespace-nowrap">
                        CA$130
                      </div>
                      <Link
                        href="/booking?service=lymphatic&minutes=60"
                        className="text-xs sm:text-sm font-medium text-zinc-900 hover:underline whitespace-nowrap"
                      >
                        Book now →
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-4 px-4 sm:px-5 py-3 sm:py-4 min-w-0">
                    <div className="text-sm sm:text-base text-zinc-700 min-w-0">
                      <span className="font-medium text-zinc-950 whitespace-nowrap">90 min</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-base sm:text-lg font-semibold text-zinc-950 whitespace-nowrap">
                        CA$160
                      </div>
                      <Link
                        href="/booking?service=lymphatic&minutes=90"
                        className="text-xs sm:text-sm font-medium text-zinc-900 hover:underline whitespace-nowrap"
                      >
                        Book now →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page-level CTA (only here) */}
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/booking"
              className="inline-flex items-center rounded-2xl bg-black px-5 py-3 text-white hover:opacity-90"
            >
              Book a spa
            </Link>
            <Link
              href="/amenities"
              className="inline-flex items-center rounded-2xl border border-black px-5 py-3 hover:bg-black/5"
            >
              Sauna & Hot Tub
            </Link>
          </div>

          <p className="mt-6 text-xs text-zinc-500">
            Services are relaxation-focused and non-diagnostic. Please inform us of
            sensitivities or conditions prior to your session.
          </p>
        </div>
      </section>
    </>
  );
}
