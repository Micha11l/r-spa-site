"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  { href: "/services",  label: "Services" },
  { href: "/therapies", label: "Therapies" },
  { href: "/bistro",    label: "Bistro" },
  { href: "/booking",   label: "Booking" },
  { href: "/faq",       label: "FAQ" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl h-16 px-4 sm:px-6 lg:px-8 flex items-center">
        {/* 左：Logo */}
        <Link
          href="/"
          className="font-serif text-2xl underline decoration-ink/20 underline-offset-4"
        >
          Rejuvenessence
        </Link>

        {/* 右：菜单 + Sign in */}
        <div className="ml-auto flex items-center gap-6">
          {/* 桌面菜单（靠右） */}
          <nav className="hidden md:flex items-center gap-8">
            {nav.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={`underline decoration-ink/20 underline-offset-4 hover:decoration-ink ${
                  pathname === i.href ? "decoration-ink" : ""
                }`}
              >
                {i.label}
              </Link>
            ))}
          </nav>

          {/* 桌面 Sign in（最右） */}
          <Link href="/sign-in" className="btn btn-primary hidden md:inline-flex">
            Sign in
          </Link>

          {/* 移动端汉堡 */}
          <button
            className="md:hidden inline-flex h-9 w-9 flex-col items-center justify-center gap-1.5 border"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="h-0.5 w-5 bg-ink" />
            <span className="h-0.5 w-5 bg-ink" />
            <span className="h-0.5 w-5 bg-ink" />
          </button>
        </div>
      </div>

      {/* 移动端抽屉 */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <nav className="px-4 sm:px-6 lg:px-8 py-3 grid gap-3">
            {nav.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={`py-2 ${pathname === i.href ? "font-semibold" : ""}`}
              >
                {i.label}
              </Link>
            ))}
            <Link href="/sign-in" className="btn btn-primary w-full mt-1">
              Sign in
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}