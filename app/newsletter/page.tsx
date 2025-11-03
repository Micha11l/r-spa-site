import Section from "@/components/Section";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Newsletter | Rejuvenessence",
  description: "ICR Therapy & Seqex training with Dr. Alberto Garoli — November 16, 2025.",
  alternates: { canonical: "/newsletter" },
};

export default function NewsletterPage() {
  return (
    <>
      {/* 顶部标题 */}
      <Section eyebrow="Newsletter" title="Experience the Future of Healing">
        <p className="max-w-2xl text-lg text-zinc-600">
          Discover the power of ICR Therapy & Seqex Technology at our exclusive live training
          event featuring <strong>Dr. Alberto Garoli</strong>. Learn how Ion Cyclotron Resonance
          (ICR) and Seqex devices are reshaping modern wellness.
        </p>
      </Section>

      {/* 活动详情 */}
      <Section title="Event details">
        <div className="grid gap-6 md:grid-cols-2 md:items-start">
          <div className="space-y-4 text-zinc-700">
            <ul className="space-y-2">
              <li>
                <strong>Date:</strong> Sunday, November 16, 2025
              </li>
              <li>
                <strong>Time:</strong> 1:00 PM – 5:00 PM
              </li>
              <li>
                <strong>Location:</strong> 7250 Keele Street, Vaughan ON L4K 1Z8
              </li>
              <li>
                <strong>Investment Fee:</strong> $30 (includes light lunch & refreshments)
              </li>
              <li>
                <strong>Speaker:</strong> Dr. Alberto Garoli — CEO of Aurora Nutriceutics & Physiomed
              </li>
            </ul>

            <Link
              href="https://www.eventbrite.ca/"
              target="_blank"
              className="btn btn-primary mt-4 inline-block"
            >
              Register on Eventbrite
            </Link>
          </div>

          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-100">
            <Image
              src="/newsletter/icr-flyer.jpg" // 你可放一张 Flyer 图到 /public/newsletter/
              alt="ICR Therapy Flyer"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </Section>

      {/* 内容介绍 */}
      <Section title="ICR Therapy and Seqex Technology">
        <div className="space-y-4 text-zinc-700 leading-relaxed">
          <p>
            <strong>ICR Therapy</strong> bridges biophysics and medicine, leveraging the natural
            resonance between ions, proteins, and the geomagnetic field to restore cellular balance.
            Human bodies are sensitive to extremely low frequency electromagnetic fields (ELF-EMF),
            and research shows specific magnetic field frequencies can modulate Ca²⁺, Mg²⁺, and
            other ions for better healing.
          </p>
          <p>
            Documented effects include reduced oxidative stress, modulation of inflammation,
            stimulation of microcirculation and tissue regeneration, pain control, and balance of the
            autonomic nervous system — all contributing to deep relaxation and cellular rejuvenation.
          </p>
          <p>
            Seqex devices operate within safe, Health Canada-licensed ranges and represent the next
            generation of bioenergetic wellness technology.
          </p>
        </div>
      </Section>

      {/* 结尾 CTA */}
      <Section>
        <div className="flex flex-wrap gap-3">
          <Link href="/booking" className="btn btn-outline">
            Explore Seqex Sessions
          </Link>
          <Link
            href="https://www.seqex.ca"
            target="_blank"
            className="btn btn-ghost"
          >
            Visit Seqex.ca
          </Link>
        </div>
        <p className="mt-6 text-sm text-zinc-500">
          This newsletter is part of our ongoing educational series. Subscribe below to receive
          upcoming wellness news and event invitations.
        </p>
      </Section>
    </>
  );
}
