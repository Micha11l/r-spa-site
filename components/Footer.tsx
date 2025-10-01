// components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-3">
        {/* Brand & Contact */}
        <div>
          <h3 className="text-lg font-semibold">Rejuvenessence</h3>
          <address className="not-italic mt-2 text-sm text-zinc-600 leading-6">
            281 Parkwood Ave.<br />
            Keswick, ON L4P 2X4<br />
            Canada
          </address>
          <div className="mt-3 space-y-1 text-sm">
            <div>
              Phone:{" "}
              <a className="underline underline-offset-2" href="tel:+12892211650">
                +1 (289) 221-1650
              </a>
            </div>
            <div>
              Email:{" "}
              <a
                className="underline underline-offset-2"
                href="mailto:ryan@nesses.ca"
              >
                ryan@nesses.ca
              </a>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <nav className="text-sm">
          <h4 className="font-semibold mb-2">Info</h4>
          <ul className="space-y-1">
            <li><Link href="/services" className="hover:underline">Services</Link></li>
            <li><Link href="/booking" className="hover:underline">Booking</Link></li>
            <li><Link href="/faq" className="hover:underline">FAQ</Link></li>
            <li><Link href="/policies" className="hover:underline">Policies &amp; Disclaimer</Link></li>
          </ul>
        </nav>

        {/* Note */}
        <div className="text-sm text-zinc-600">
          Not a medical service. Wellness sessions only. See policies for details.
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-8 text-xs text-zinc-500">
        © {new Date().getFullYear()} Rejuvenessence
      </div>
    </footer>
  );
}