import Image from "next/image";
import Section from "@/components/Section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compliance & Certificates",
  description:
    "Seqex is licensed by Health Canada (Class II). View certificates and compliance details.",
  alternates: { canonical: "/licenses" },
};

const CERTS = [
  "/licenses/1.jpg",
  "/licenses/2.jpg",
  "/licenses/3.jpg",
  "/licenses/4.jpg",
];

export default function LicensesPage() {
  return (
    <>
      <Section eyebrow="Compliance" title="Certificates & Licensing">
        <p className="text-zinc-600 max-w-3xl">
          Seqex is the first Pulsed Electromagnetic Field Therapy device that
          implements Ion Cyclotronic Resonnance-like therapy to be licensed by
          Health Canada as a Class II Medical Device.
        </p>
        <p className="text-zinc-600 max-w-3xl mt-4">
          The use of this technology as integrated medicine is the future of
          medicine. This is particularly important in light of the exposure to
          environmental toxins and high frequencies that we face in today’s
          environment and how so many people have become ill as a result.
          Integrating this revolutionary device with more traditional
          therapeutics for optimal patient results is the goal of Health
          Wellness Industries Inc.
        </p>

        {/* 证照 2x2 网格 */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {CERTS.map((src, i) => (
            <div
              key={src}
              className="relative aspect-[4/3] w-full rounded-lg border bg-white"
            >
              <Image
                src={src}
                alt={`Certificate ${i + 1}`}
                fill
                sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 600px"
                className="object-contain p-3"
                priority={i < 2}
              />
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-zinc-500">
          Certifications and permits are available on-site upon request.
        </p>
      </Section>
    </>
  );
}