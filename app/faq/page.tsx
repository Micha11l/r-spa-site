import type { Metadata } from "next";
import Section from "@/components/Section";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about Seqex PEMF, Plasma Light (RX1/RX6), and Ondamed biofeedback, plus booking and safety information.",
  alternates: { canonical: "/faq" },
};

const faqs = [
  {
    q: "What therapies do you offer?",
    a: (
      <>
        We offer three modern modalities:
        <br />
        <strong>Seqex</strong> (PEMF with Ion Cyclotronic Resonance–like programming),
        <strong> Plasma Light</strong> (near-infrared RX1/RX6), and{" "}
        <strong>Ondamed</strong> (biofeedback-guided focused PEMF). These can be used
        individually or combined, alongside spa amenities.
      </>
    ),
  },
  {
    q: "Are these devices licensed?",
    a: (
      <>
        Devices used in-studio are licensed with Health Canada (Class II where
        applicable; e.g., Seqex PEMF). Sessions are provided as wellness support
        to improve comfort, relaxation, recovery and function.
      </>
    ),
  },
  {
    q: "How does Seqex work?",
    a: (
      <>
        Seqex delivers low-intensity pulsed electromagnetic fields coordinated with
        the geomagnetic field to help restore electrical balance. This supports
        cellular communication, circulation, comfort and natural recovery.
      </>
    ),
  },
  {
    q: "What is Plasma Light (RX1/RX6)?",
    a: (
      <>
        Near-infrared photobiomodulation (~600–1200 nm) that stimulates cells for
        comfort, tissue regeneration and faster recovery. It’s often used for
        joint/nerve discomfort, skin concerns, circulation and energy balance.
      </>
    ),
  },
  {
    q: "What is Ondamed?",
    a: (
      <>
        A biofeedback system that identifies priority zones/frequencies, then
        applies focused PEMF. Pulse/oxygen feedback helps personalize each
        session for stress regulation, comfort and functional support.
      </>
    ),
  },
  {
    q: "What can these sessions help with?",
    a: (
      <>
        Common goals include: reducing everyday pain/inflammation; improving
        circulation, oxygenation and detox support; relaxing muscles; supporting
        sleep, energy and focus; skin/wound recovery; bone/soft-tissue
        healing; lymphatic flow; and hormonal/nerve system balance.
        Responses vary by person.
      </>
    ),
  },
  {
    q: "How long is a session?",
    a: (
      <>
        Typical times: Seqex <strong>45–60 min</strong>, Plasma Light{" "}
        <strong>20–45 min</strong> (RX1 seat ≈ 20 min), Ondamed{" "}
        <strong>60–90 min</strong>. Allow a few extra minutes for setup and questions.
      </>
    ),
  },
  {
    q: "What should I wear or bring?",
    a: (
      <>
        Comfortable clothing with minimal metal accessories. Stay hydrated
        before/after. If you have recent reports from your clinician, you may
        bring them for context (optional).
      </>
    ),
  },
  {
    q: "How many sessions will I need?",
    a: (
      <>
        For new goals, many clients begin with <strong>1–2×/week for 3–6 weeks</strong>,
        then taper. Programs are personalized; we’ll suggest a cadence after your
        first visit.
      </>
    ),
  },
  {
    q: "Are there contraindications?",
    a: (
      <>
        Please avoid or obtain medical clearance if you have: implanted electronic
        devices (e.g., pacemaker/defibrillator/insulin pump), pregnancy, active
        bleeding, photosensitivity disorders (for light), unmanaged seizures, or
        any condition for which your clinician advises against PEMF/light use. If
        unsure, ask us—we’re happy to coordinate with your provider.
      </>
    ),
  },
  {
    q: "Can I combine therapies or use the sauna/hot tub?",
    a: (
      <>
        Yes. Many guests combine Seqex or Ondamed with Plasma Light and/or sauna/hot
        tub for circulation and relaxation. We’ll time the order for best comfort.
      </>
    ),
  },
  {
    q: "Is this covered by insurance?",
    a: (
      <>
        Wellness sessions are generally not billed to insurance. We can provide a
        detailed receipt upon request.
      </>
    ),
  },
  {
    q: "What’s your cancellation policy?",
    a: (
      <>
        Please provide <strong>24 hours notice</strong> to reschedule or cancel (see{" "}
        <a href="/policies" className="underline">Policies</a> for details).
      </>
    ),
  },
];

export default function FAQPage() {
  return (
    <>
      <Section 
      eyebrow="Help" 
      title="Frequently Asked Questions"
      compact
      contentClassName="mt-4 sm:mt-5"
      >
        <p className="max-w-3xl text-lg text-zinc-600">
          Helpful details about our modalities, safety and how to plan your visit.
        </p>
      </Section>

      <Section compact>
        <div className="grid gap-6 md:grid-cols-2">
          {faqs.map(({ q, a }) => (
            <div key={q} className="rounded-xl border bg-white p-5 shadow-sm">
              <h3 className="font-semibold">{q}</h3>
              <div className="mt-2 text-zinc-700">{a}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section compact>
        <p className="text-sm text-zinc-500">
          Information is educational and for wellness support. It is not a
          diagnosis or prescription. Please continue to follow the advice of your
          physician or primary healthcare provider.
        </p>
      </Section>
    </>
  );
}