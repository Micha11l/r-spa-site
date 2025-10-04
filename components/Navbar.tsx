"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/learn-more", label: "Therapies" },
  { href: "/bistro", label: "Bistro" },
  { href: "/licenses", label: "Licenses" },
  { href: "/booking", label: "Booking" },
  { href: "/faq", label: "FAQ" },
  { href: "/policies", label: "Policies" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal 需要等待挂载，且抽屉打开时禁止 body 滚动
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, mounted]);

  const Brand = (
    <Link
      href="/"
      className="font-serif text-2xl md:text-3xl tracking-wide hover:opacity-90"
      onClick={() => setOpen(false)}
    >
      Rejuvenessence
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        {Brand}

        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center gap-6 text-[15px]">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`hover:opacity-80 ${
                  active ? "font-medium underline underline-offset-4" : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 移动端汉堡 */}
        <button
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 ring-1 ring-zinc-300"
        >
          <div aria-hidden className="space-y-1.5">
            <span className="block h-0.5 w-6 bg-black"></span>
            <span className="block h-0.5 w-6 bg-black"></span>
            <span className="block h-0.5 w-6 bg-black"></span>
          </div>
        </button>
      </div>

      {/* 移动端抽屉（Portal 到 body，白底+遮罩，可点击） */}
      {mounted &&
        createPortal(
          <div className={open ? "" : "pointer-events-none"} id="mobile-drawer">
            {/* 遮罩 */}
            <div
              onClick={() => setOpen(false)}
              className={`fixed inset-0 bg-black/40 transition-opacity ${
                open ? "opacity-100" : "opacity-0"
              }`}
            />
            {/* 侧栏 */}
            <aside
              className={`fixed inset-y-0 right-0 w-[80%] max-w-[340px] bg-white shadow-2xl transition-transform duration-300 will-change-transform
                ${open ? "translate-x-0" : "translate-x-full"}`}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between p-4 border-b">
                {Brand}
                <button
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md ring-1 ring-zinc-300"
                >
                  <span className="sr-only">Close</span>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <nav className="p-3">
                <ul className="flex flex-col text-lg">
                  {NAV.map((item) => {
                    const active =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`block rounded-lg px-3 py-3 ${
                            active ? "bg-zinc-100 font-medium" : "hover:bg-zinc-50"
                          }`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>
          </div>,
          document.body
        )}
    </header>
  );
}