// app/seqex/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Seqex & Plasma Light Therapies",
  description:
    "Seqex sessions, Plasma RX devices, Vitamin-D UVB and more. Non-medical wellness sessions in Keswick / Toronto.",
  alternates: { canonical: "/seqex" },
};

function PageHeader() {
  return (
    <section className="relative">
      <div className="relative h-[38svh] sm:h-[44svh] lg:h-[52svh]">
        <Image
          src="/gallery/seqex.jpg"
          alt="Seqex & Plasma light therapies"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white">
              Seqex & Plasma Light Therapies
            </h1>
            <p className="mt-3 text-white/90">
              Gentle, modern devices for relaxation and recovery.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SeqexPage() {
  return (
    <>
      <PageHeader />

      <section className="py-10 sm:py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <header className="mb-6 sm:mb-8">
            <div className="text-xs tracking-widest text-zinc-500 uppercase">
              Therapies & Pricing
            </div>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl md:text-4xl">
              What we offer
            </h2>
          </header>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Seqex & combos */}
            <div className="rounded-xl border p-5 sm:p-6">
              <div className="font-medium tracking-wide">Seqex</div>
              <ul className="mt-3 space-y-1.5 text-zinc-700">
                <li>Individual Session (27–60m) — <b>$60</b></li>
                <li>10-Session Package — <b>$500</b></li>
                <li>Personalized Electroceutical Test — <b>$200</b></li>
                <li>Seqex + Plasma Lights (75m) — <b>$75</b></li>
              </ul>

              <div className="mt-6 font-medium tracking-wide">
                RX6 Full Body (40m)
              </div>
              <ul className="mt-3 space-y-1.5 text-zinc-700">
                <li>Single — <b>$200</b></li>
                <li>5 Pack — <b>$900</b></li>
              </ul>
            </div>

            {/* Lights / UVB / Vibration */}
            <div className="rounded-xl border p-5 sm:p-6">
              <div className="font-medium tracking-wide">Plasma RX1 / RX2</div>
              <ul className="mt-3 space-y-1.5 text-zinc-700">
                <li>Targeted Session (20m) — <b>$50</b></li>
                <li>5 Pack — <b>$225</b></li>
                <li>10 Pack — <b>$400</b></li>
              </ul>

              <div className="mt-6 font-medium tracking-wide">
                Solarc Vitamin-D UVB
              </div>
              <ul className="mt-3 space-y-1.5 text-zinc-700">
                <li>Single (4m) — <b>$25</b></li>
                <li>10-Session Package — <b>$200</b></li>
              </ul>

              <div className="mt-6 font-medium tracking-wide">
                Vibration + Thigh Scanner
              </div>
              <ul className="mt-3 space-y-1.5 text-zinc-700">
                <li>10–20m Session — <b>$40</b></li>
                <li>10 Pack — <b>$350</b></li>
              </ul>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-10 sm:mt-12 grid lg:grid-cols-3 gap-6">
            {[
              {
                t: "Comfort first",
                d: "Non-invasive, non-medical wellness sessions. You stay clothed and relaxed.",
              },
              {
                t: "Personalized options",
                d: "Seqex personalized test helps tailor follow-up sessions for you.",
              },
              {
                t: "Combine smartly",
                d: "Light, UVB and vibration can be stacked around your main session.",
              },
            ].map((x) => (
              <div key={x.t} className="rounded-xl border p-5">
                <div className="font-medium">{x.t}</div>
                <p className="mt-2 text-zinc-600">{x.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/booking?service=Seqex Session (27m)"
              className="inline-flex items-center rounded-xl bg-black px-5 py-3 text-white hover:opacity-90"
            >
              Book a session
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center rounded-xl border border-black px-5 py-3 hover:bg-black/5"
            >
              Read FAQ
            </Link>
          </div>

          <p className="mt-6 text-xs text-zinc-500">
            Sessions are provided for general wellness. Availability and
            pricing may change.
          </p>
        </div>
      </section>
    </>
  );
}