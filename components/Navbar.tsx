"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // 锁定滚动，避免抽屉打开时页面滚动到别处
  useEffect(() => {
    const root = document.documentElement;
    if (open) root.style.overflow = "hidden";
    else root.style.overflow = "";
    return () => {
      root.style.overflow = "";
    };
  }, [open]);

  const MenuIcon = () => (
    <svg
      width="28"
      height="20"
      viewBox="0 0 24 18"
      aria-hidden="true"
      className="block"
    >
      <rect x="2" y="2" width="20" height="2" rx="1" />
      <rect x="2" y="8" width="20" height="2" rx="1" />
      <rect x="2" y="14" width="20" height="2" rx="1" />
    </svg>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl leading-none">
          Rejuvenessence
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/services" className="hover:underline">
            Services
          </Link>
          <Link href="/therapies" className="hover:underline">
            Therapies
          </Link>
          <Link href="/booking" className="hover:underline">
            Booking
          </Link>
          <Link href="/faq" className="hover:underline">
            FAQ
          </Link>
          <Link href="/policies" className="hover:underline">
            Policies
          </Link>
        </nav>

        {/* 移动端菜单按钮 */}
        <button
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="md:hidden p-3 -mr-2"
        >
          <MenuIcon />
        </button>
      </div>

      {/* 移动端抽屉（Portal 渲染，iOS 点击更稳定） */}
      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[100]">
            {/* 遮罩 */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
            />
            {/* 抽屉本体 */}
            <aside
              className="absolute right-0 top-0 h-full w-72 max-w-[85%] bg-white shadow-xl z-[110] pointer-events-auto"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between h-16 px-4 border-b">
                <span className="font-serif text-xl">Rejuvenessence</span>
                <button
                  aria-label="Close menu"
                  className="p-2"
                  onClick={() => setOpen(false)}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    className="block"
                  >
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <ul className="px-2 py-1 text-[15px]">
                {[
                  { href: "/services", label: "Services" },
                  { href: "/therapies", label: "Therapies" },
                  { href: "/booking", label: "Booking" },
                  { href: "/faq", label: "FAQ" },
                  { href: "/policies", label: "Policies" },
                ].map((i) => (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={() => setOpen(false)}
                      className="block px-2 py-3 border-b border-zinc-100"
                    >
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          </div>,
          document.body
        )}
    </header>
  );
}