// app/spa/page.tsx
import Section from "@/components/Section";
import Link from "next/link";

export const metadata = {
  title: "Spa Treatments",
  description: "Head, back & shoulders, full body and hot stone — popular options.",
};

const items = [
  {
    name: "Head Massage",
    range: "$110 – $130",
    duration: "45–60 min",
    desc: "Focus on scalp, temples and neck to relieve daily tension.",
  },
  {
    name: "Back & Shoulders",
    range: "$120 – $140",
    duration: "60 min",
    desc: "Targeted back, shoulders and neck relief.",
  },
  {
    name: "Full Body",
    range: "$140 – $160",
    duration: "75–90 min",
    desc: "Balanced full-body relaxation session.",
  },
  {
    name: "Hot Stone",
    range: "$150 – $160",
    duration: "75–90 min",
    desc: "Warm stones to melt tightness and promote deep ease.",
  },
];

export default function SpaPage() {
  return (
    <Section
      eyebrow="Spa"
      title="Popular spa treatments"
      desc="Introductory pricing. Times & availability may vary. Please book in advance."
    >
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((it) => (
          <article key={it.name} className="rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold">{it.name}</h3>
            <p className="mt-1 text-gray-700">{it.desc}</p>
            <p className="mt-2 text-sm">Duration: {it.duration}</p>
            <p className="text-sm">Price: {it.range} + HST</p>
          </article>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/booking" className="rounded-xl bg-black px-5 py-3 text-white hover:opacity-90">
          Book spa
        </Link>
      </div>
    </Section>
  );
}