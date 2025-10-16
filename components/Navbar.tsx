"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/therapies", label: "Therapies" },
  { href: "/bistro", label: "Bistro" },
  { href: "/booking", label: "Booking" },
  { href: "/faq", label: "FAQ" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      {/* 注意：不要再用 max-w 容器；用全宽 + relative 才能实现“绝对居中” */}
      <div className="relative h-16 w-full px-4 sm:px-6 lg:px-8">
        {/* 左：Logo（自然靠左） */}
        <div className="flex h-full items-center">
          <Link
            href="/"
            className="font-serif text-2xl underline decoration-ink/20 underline-offset-4"
          >
            Rejuvenessence
          </Link>

          {/* 中：导航，absolute + left-1/2 实现相对视口居中 */}
          <nav className="pointer-events-auto absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex gap-8">
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

          {/* 右：Sign in（用 ml-auto 抵到最右） */}
          <div className="ml-auto hidden md:flex">
            <Link href="/sign-in" className="btn btn-primary">Sign in</Link>
          </div>

          {/* 移动端汉堡 */}
          <button
            className="md:hidden ml-auto inline-flex h-9 w-9 items-center justify-center border"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="block h-0.5 w-5 bg-ink mb-1" />
            <span className="block h-0.5 w-5 bg-ink mb-1" />
            <span className="block h-0.5 w-5 bg-ink" />
          </button>
        </div>

        {/* 移动端抽屉 */}
        {open && (
          <div className="md:hidden absolute inset-x-0 top-16 border-t bg-white">
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
      </div>
    </header>
  );
}