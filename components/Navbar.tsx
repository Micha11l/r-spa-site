// components/Navbar.tsx
"use client";
import Link from "next/link";
import { useState } from "react";

const NAV = [
  { href: "/services", label: "SERVICES" },
  { href: "/booking",  label: "BOOK NOW" },
  { href: "/faq",      label: "FAQ" },
  { href: "/policies", label: "POLICIES" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 border-b">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl md:text-2xl">
          Rejuvenessence
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {NAV.map((it) => (
            <Link key={it.href} href={it.href} className="hover:opacity-70 tracking-wide">
              {it.label}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <span>☰</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex flex-col">
            {NAV.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className="py-3 border-b last:border-0"
                onClick={() => setOpen(false)}
              >
                {it.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}