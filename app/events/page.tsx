// app/events/page.tsx
import Section from "@/components/Section";

export const metadata = {
  title: "Private Events & Parties",
  description: "Up to 50 guests. On-site only. Please contact us to discuss details.",
};

export default function EventsPage() {
  return (
    <Section
      eyebrow="Private events"
      title="Parties & gatherings (up to 50)"
      desc="Not bookable online. Call or email us to design your time — availability, amenities and custom arrangements."
    >
      <div className="rounded-2xl overflow-hidden ring-1 ring-black/5">
        <img src="/gallery/events.png" alt="Events" className="w-full h-[360px] object-cover" />
      </div>
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <Info title="Capacity" body="Up to 50 people" />
        <Info title="Includes" body="Spa areas, sauna, hot tub, lounge/bar space" />
        <Info title="Contact" body="+1 905-476-1937 · booking@nesses.ca" />
      </div>
      <p className="mt-6 text-gray-700">
        Food & drinks can be arranged on site. Tell us your idea and we’ll propose a simple plan.
      </p>
    </Section>
  );
}

function Info({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-gray-200 p-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1">{body}</p>
    </article>
  );
}