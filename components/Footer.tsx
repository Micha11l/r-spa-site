// components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Brand & Contact */}
        <div>
          <div className="font-serif text-xl">Rejuvenessence</div>
          <div className="mt-2 text-sm text-zinc-600 space-y-1">
            <div>281 Parkwood Ave</div>
            <div>Keswick, ON L4P 2X4</div>
            <div>Canada</div>
            <div className="mt-2">Phone: +1 (289) 221-1650</div>
            <div>Email: <a className="underline" href="mailto:ryan@nesses.ca">ryan@nesses.ca</a></div>
          </div>
        </div>

        {/* Links */}
        <nav className="text-sm">
          <div className="font-medium">Info</div>
          <ul className="mt-3 space-y-2">
            <li><Link href="/services" className="hover:underline">Services</Link></li>
            <li><Link href="/booking" className="hover:underline">Booking</Link></li>
            <li><Link href="/faq" className="hover:underline">FAQ</Link></li>
            <li><Link href="/policies" className="hover:underline">Policies & Disclaimer</Link></li>
          </ul>
        </nav>

        {/* Note */}
        <div className="text-sm text-zinc-600">
          Not a medical service. Wellness sessions only. See policies for details.
        </div>
      </div>

      <div className="border-t py-4 text-xs text-zinc-500">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Rejuvenessence
        </div>
      </div>
    </footer>
  );
}