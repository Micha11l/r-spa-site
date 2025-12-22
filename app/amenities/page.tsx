// app/amenities/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sauna & Hot Tub",
  description:
    "Heat, soak and reset. Optional add-ons around your session in Keswick / Toronto.",
  alternates: { canonical: "/amenities" },
};

function PageHeader() {
  return (
    <section className="relative">
      <div className="relative h-[38svh] sm:h-[44svh] lg:h-[52svh]">
        <Image
          src="/gallery/amenities.jpg"
          alt="Sauna & Hot Tub"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white">
              Sauna & Hot Tub
            </h1>
            <p className="mt-3 text-white/90">
              Great before or after your session.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AmenitiesPage() {
  return (
    <>
      <PageHeader />

      <section className="py-10 sm:py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <header className="mb-6 sm:mb-8">
            <div className="text-xs tracking-widest text-zinc-500 uppercase">
              Benefits
            </div>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl md:text-4xl">
              Heat, cold and soak — reset the body
            </h2>
          </header>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <div className="rounded-xl border p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-lg">Sauna</div>
                  <div className="text-sm text-zinc-500 mt-1">30 min</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-emerald-600">
                    CA$45
                  </div>
                </div>
              </div>
              <ul className="space-y-2 text-zinc-700 list-disc list-inside">
                <li>Warmth helps loosen tension before a session.</li>
                <li>Encourages circulation and deep breathing.</li>
                <li>Great in contrast with a cool rinse.</li>
              </ul>
            </div>

            <div className="rounded-xl border p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-lg">Hot Tub</div>
                  <div className="text-sm text-zinc-500 mt-1">30 min</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-emerald-600">
                    CA$45
                  </div>
                </div>
              </div>
              <ul className="space-y-2 text-zinc-700 list-disc list-inside">
                <li>Full-body soak for calm and comfort.</li>
                <li>Pairs well with spa or light sessions.</li>
                <li>Unwind with a few quiet minutes on your own.</li>
              </ul>
            </div>
          </div>

          {/* Massage Package Note */}
          <div className="mt-8 rounded-xl bg-emerald-50 border-2 border-emerald-200 p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="h-5 w-5 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-900 mb-1">
                  Included Free with Massage
                </h3>
                <p className="text-sm text-emerald-800 leading-relaxed">
                  Sauna and Hot Tub sessions are included complimentary with any 60 or 90-minute massage booking.
                  This applies to our current massage services and select packages.
                  Ask our staff for details when booking.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/booking"
              className="inline-flex items-center rounded-xl bg-black px-5 py-3 text-white hover:opacity-90"
            >
              Book now
            </Link>
            <Link
              href="/spa"
              className="inline-flex items-center rounded-xl border border-black px-5 py-3 hover:bg-black/5"
            >
              Explore spa menu
            </Link>
          </div>

          <p className="mt-6 text-xs text-zinc-500">
            Safety tips: hydrate well; avoid alcohol before use; stop if you
            feel light-headed, pause and let our staff know. Sessions are wellness-focused and non-diagnostic.
          </p>
        </div>
      </section>
    </>
  );
}