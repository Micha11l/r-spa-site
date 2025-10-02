import type { Metadata } from "next";
import Section from "@/components/Section";

export const metadata: Metadata = {
  title: "Policies",
  description:
    "Booking, rescheduling, health & safety, payment, packages, privacy and facility policies.",
  alternates: { canonical: "/policies" },
};

export default function PoliciesPage() {
  return (
    <>
      <Section eyebrow="Guidelines" 
      title="Studio Policies"
      compact
      contentClassName="mt-4 sm:mt-5"
      >
        <p className="max-w-3xl text-lg text-zinc-600">
          Clear and simple policies keep everyone comfortable and on time. Thank
          you for reading these before your visit.
        </p>
      </Section>

      <Section title="Booking & arrival" compact>
        <ul className="space-y-2 text-zinc-700">
          <li>
            Sessions are by appointment. Please arrive{" "}
            <strong>5–10 minutes</strong> early for check-in or forms.
          </li>
          <li>
            Comfortable clothing is recommended. Remove metal accessories where possible.
          </li>
          <li>
            Amenities (sauna/hot tub) may be scheduled before or after your session;
            staff will advise on the best order.
          </li>
        </ul>
      </Section>

      <Section title="Rescheduling & cancellations" compact>
        <ul className="space-y-2 text-zinc-700">
          <li>
            Kindly provide <strong>24 hours notice</strong> to reschedule or cancel so
            we can offer the time to other guests.
          </li>
          <li>
            Missed appointments or repeated late changes may require pre-payment for
            future bookings.
          </li>
          <li>
            If you are unwell, please contact us—we’ll happily move your visit.
          </li>
        </ul>
      </Section>

      <Section title="Health & safety" compact>
        <ul className="space-y-2 text-zinc-700">
          <li>
            Some conditions require medical clearance (e.g., implanted electronic
            devices, pregnancy, photosensitivity, unmanaged seizures). If unsure,
            please ask prior to booking.
          </li>
          <li>
            We reserve the right to decline a session if it appears unsafe or
            unsuitable, and will suggest alternatives where possible.
          </li>
          <li>
            Surfaces and equipment are cleaned between guests. Please follow any
            staff instructions for safe use of amenities/devices.
          </li>
        </ul>
      </Section>

      <Section title="Payments, packages & pricing" compact>
        <ul className="space-y-2 text-zinc-700">
          <li>We accept standard electronic payments; prices include applicable taxes unless noted.</li>
          <li>Packages are non-transferable and typically expire 12 months from purchase.</li>
          <li>Gift cards are final sale and may not be redeemed for cash.</li>
          <li>Pricing, services and hours are subject to change.</li>
        </ul>
      </Section>

      <Section title="Privacy" compact>
        <ul className="space-y-2 text-zinc-700">
          <li>
            We only collect information needed to book sessions and personalize your
            visit. Your details are kept confidential and not sold to third parties.
          </li>
          <li>
            You may request correction or deletion of your contact information at any time.
          </li>
        </ul>
      </Section>

      <Section title="Facilities & conduct" compact>
        <ul className="space-y-2 text-zinc-700">
          <li>Please respect a calm environment for all guests.</li>
          <li>Children/minors must be accompanied by a parent or legal guardian.</li>
          <li>No photography of other guests without consent.</li>
          <li>Service animals are welcome; otherwise please refrain from bringing pets.</li>
        </ul>
      </Section>

      <Section title="Events & private rentals" compact>
        <ul className="space-y-2 text-zinc-700">
          <li>
            Private events are by inquiry and subject to a separate agreement
            (date/time, capacity, deposit and cleanup).
          </li>
          <li>Contact us for details and availability.</li>
        </ul>
      </Section>

      <Section compact>
        <p className="text-sm text-zinc-500">
          Our sessions provide wellness support and education. They do not replace
          advice or care from your physician or primary healthcare provider. Please
          consult your clinician about any medical questions.
        </p>
      </Section>
    </>
  );
}