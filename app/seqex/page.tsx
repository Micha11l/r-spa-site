// app/seqex/page.tsx
import Section from "@/components/Section";
import Link from "next/link";

export const metadata = {
  title: "Seqex & Plasma Light Therapies",
  description: "Seqex sessions, personalized tests, RX1/RX6 plasma lights, Vitamin-D UVB and more.",
};

export default function SeqexPage() {
  return (
    <>
      <Section
        eyebrow="Therapies"
        title="Seqex & Plasma Light"
        desc="Explore our device-based sessions and packages. Times and prices below are introductory and may be adjusted."
      >
        {/* Seqex 套餐 */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card
            title="Seqex Session · Promotion"
            price="$50 + HST"
            details={[
              "27 min preset program",
            ]}
          />
          <Card
            title="Seqex Session · Single"
            price="$75 + HST"
            details={[
              "27 min preset program",
              "FREE Vitamin D UVB 4 min (2+2)",
              "Total time ~31 min",
            ]}
          />
          <Card
            title="Seqex Session · Double"
            price="$150 + HST"
            details={[
              "Two × 27 min preset programs",
              "FREE Vitamin D UVB 4 min (2+2)",
              "Total time ~58 min",
            ]}
          />
          <Card
            title="Seqex 10-Pack"
            price="$1,350 + HST"
            details={[
              "Per session: Two × 36 min preset programs",
              "One FREE treatment benefit",
              "Optional FREE UVB (4 min) at your discretion",
              "Total time per session ~58 min",
            ]}
          />
        </div>

        {/* 个性化 / 特殊 */}
        <h3 className="mt-10 text-xl font-semibold">Personalized & Special</h3>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <Card
            title="Seqex Personalized Test"
            price="$250 + HST"
            details={["~1h20m on Seqex MED (Med Bed)"]}
          />
          <Card
            title="Personalized Test & Card"
            price="$300 + HST"
            details={[
              "~1h20m on Seqex MED",
              "Your personalized programmed card",
            ]}
          />
          <Card
            title="ICR Treatment"
            price="$200 + HST"
            details={["12 min treatment", "ICR Personalized Card"]}
          />
          <Card
            title="Amygdala Flush"
            price="$250 + HST"
            details={["Trauma releasing (with probe)"]}
          />
          <Card
            title="Special Treatment"
            price="$250 + HST"
            details={[
              "Full treatment on MED BED",
              "No personalized card for this specific protocol",
            ]}
          />
        </div>

        {/* 其它设备 */}
        <h3 className="mt-10 text-xl font-semibold">Other devices</h3>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <Card
            title="Vitamin D UVB"
            price="$30 + HST"
            details={["4 min (2 min each side)"]}
            footnote="10-pack: $250 + HST ($25 each)"
          />
          <Card
            title="RX1 Seat Plasma Light"
            price="$50 + HST"
            details={["Two × 10 min per session"]}
            footnote="10-pack: $450 + HST · 20-pack: $800 + HST"
          />
          <Card
            title="LifeForce · Cellular Regeneration"
            price="$175 + HST"
            details={["Cellular regeneration therapy"]}
          />
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Notes: Device-based sessions are non-medical and not a substitute for professional care. Availability and durations may vary. {/* 来源：你上传的价目表 */} 
        </p>

        <div className="mt-6">
          <Link href="/booking" className="rounded-xl bg-black px-5 py-3 text-white hover:opacity-90">
            Book a session
          </Link>
        </div>
      </Section>
    </>
  );
}

function Card({
  title, price, details, footnote,
}: { title: string; price: string; details?: string[]; footnote?: string; }) {
  return (
    <article className="rounded-2xl border border-gray-200 p-5">
      <h4 className="text-base font-semibold">{title}</h4>
      <p className="mt-1 text-xl">{price}</p>
      <ul className="mt-3 text-sm text-gray-700 list-disc pl-5 space-y-1">
        {details?.map((d) => <li key={d}>{d}</li>)}
      </ul>
      {footnote && <p className="mt-3 text-xs text-gray-500">{footnote}</p>}
    </article>
  );
}