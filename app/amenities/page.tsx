// app/amenities/page.tsx
import Section from "@/components/Section";

export const metadata = {
  title: "Sauna & Hot Tub",
  description: "Heat, soak and unwind — a great pairing before or after sessions.",
};

export default function AmenitiesPage() {
  return (
    <>
      <Section
        eyebrow="Amenities"
        title="Sauna & Hot Tub"
        desc="Available for guests before/after sessions. Please ask us when booking."
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl overflow-hidden ring-1 ring-black/5">
            <img src="/gallery/sauna.jpg" alt="Sauna" className="w-full h-[320px] object-cover" />
          </div>
          <div className="rounded-2xl overflow-hidden ring-1 ring-black/5">
            <img src="/gallery/hottub.jpg" alt="Hot tub" className="w-full h-[320px] object-cover" />
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <article className="rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold">Sauna benefits</h3>
            <ul className="mt-2 list-disc pl-5 text-gray-700 space-y-1">
              <li>Warmth to loosen tightness and ease the body</li>
              <li>Encourages post-session relaxation</li>
              <li>Pairs well with light/Seqex sessions</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold">Hot tub benefits</h3>
            <ul className="mt-2 list-disc pl-5 text-gray-700 space-y-1">
              <li>Gentle soak to unwind</li>
              <li>Helps you transition into deeper rest</li>
              <li>Optional cool dip between sauna rounds</li>
            </ul>
          </article>
        </div>
      </Section>
    </>
  );
}