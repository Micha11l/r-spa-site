"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "/services", label: "Services" },
  { href: "/therapies", label: "Therapies" }, // 新增
  { href: "/booking", label: "Booking" },
  { href: "/faq", label: "FAQ" },
  { href: "/policies", label: "Policies" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // 打开侧栏时锁定页面滚动
  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", open);
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-zinc-200">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-2xl font-serif tracking-tight">
          Rejuvenessence
        </Link>

        {/* 桌面菜单 */}
        <nav className="hidden gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-zinc-700 hover:text-black"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* 移动端按钮 */}
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(true)}
          className="md:hidden inline-flex items-center justify-center rounded-md p-2"
        >
          {/* 简单三条线图标 */}
          <span className="block h-0.5 w-6 bg-black mb-1" />
          <span className="block h-0.5 w-6 bg-black mb-1" />
          <span className="block h-0.5 w-6 bg-black" />
        </button>
      </div>

      {/* 移动端抽屉 + 遮罩 */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          {/* 右侧白色抽屉 */}
          <nav
            id="mobile-menu"
            className="ml-auto h-full w-[85%] max-w-xs bg-white shadow-xl p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="text-xl font-serif tracking-tight"
              >
                Rejuvenessence
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="p-2"
              >
                {/* 关闭图标 (X) */}
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path
                    d="M6 6l12 12M18 6l-12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <ul className="mt-6 space-y-3">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block text-lg text-zinc-800"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}