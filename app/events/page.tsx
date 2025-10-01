// app/events/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Private Events & Parties",
  description:
    "Host small, private gatherings (≤ 50 people). Phone/email inquiry only.",
  alternates: { canonical: "/events" },
};

function PageHeader() {
  return (
    <section className="relative">
      <div className="relative h-[38svh] sm:h-[44svh] lg:h-[52svh]">
        <Image
          src="/gallery/events.png"
          alt="Private events"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white">
              Private Events & Parties
            </h1>
            <p className="mt-3 text-white/90">
              Space for intimate gatherings. Up to 50 people.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function EventsPage() {
  return (
    <>
      <PageHeader />

      <section className="py-10 sm:py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 rounded-xl border p-5 sm:p-6">
              <h2 className="font-serif text-2xl sm:text-3xl">What’s included</h2>
              <ul className="mt-4 space-y-2 text-zinc-700 list-disc list-inside">
                <li>Cozy, minimalist space with spa-like ambience</li>
                <li>Access to sauna & hot tub (optional)</li>
                <li>Bar area for food & drinks (bring your own options)</li>
                <li>Staff on site for coordination</li>
              </ul>

              <h3 className="mt-6 font-medium">Good for</h3>
              <ul className="mt-2 space-y-2 text-zinc-700 list-disc list-inside">
                <li>Birthdays, showers, small celebrations</li>
                <li>Wellness themed meetups & private sessions</li>
                <li>Team wind-down / socials</li>
              </ul>

              <p className="mt-6 text-sm text-zinc-600">
                Note: Events are <b>inquiry only</b> (no online booking). Capacity
                is flexible up to ~50 people depending on layout.
              </p>
            </div>

            <div className="rounded-xl border p-5 sm:p-6">
              <h2 className="font-serif text-2xl sm:text-3xl">Get in touch</h2>
              <p className="mt-3 text-zinc-700">
                Tell us your date, headcount and ideas. We’ll help shape a simple plan.
              </p>
              <div className="mt-5 space-y-2">
                <div>Phone: <a className="underline" href="tel:+12892211650">+1 (289) 221-1650</a></div>
                <div>Email: <a className="underline" href="mailto:ryan@nesses.ca">ryan@nesses.ca</a></div>
              </div>

              <div className="mt-6">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-xl bg-black px-5 py-3 text-white hover:opacity-90"
                >
                  Back to home
                </Link>
              </div>

              <p className="mt-6 text-xs text-zinc-500">
                Not a medical service. House rules and safety policies apply.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}