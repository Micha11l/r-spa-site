// components/Navbar.tsx
"use client";
import Link from "next/link";
import { useState } from "react";

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/seqex", label: "Therapies" }, // 新增
  { href: "/booking", label: "Booking" },
  { href: "/faq", label: "FAQ" },
  { href: "/policies", label: "Policies" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-serif text-2xl tracking-wide"
          aria-label="Rejuvenessence home"
        >
          Rejuvenessence
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:opacity-80">
              {n.label}
            </Link>
          ))}
        </nav>

        {/* 手机菜单按钮 */}
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center rounded-md p-2 md:hidden"
          aria-label="Open menu"
        >
          <span className="block h-0.5 w-6 bg-black"></span>
          <span className="mt-1 block h-0.5 w-6 bg-black"></span>
          <span className="mt-1 block h-0.5 w-6 bg-black"></span>
        </button>
      </div>

      {/* 抽屉式侧边菜单（手机） */}
      {open && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-72 bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <Link
                href="/"
                className="font-serif text-xl"
                onClick={() => setOpen(false)}
              >
                Rejuvenessence
              </Link>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="p-2 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <ul className="p-2">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-3 text-sm hover:bg-black/5"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}