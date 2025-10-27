"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Home, LogOut } from "lucide-react";
import AdminCalendar from "@/components/AdminCalendar";

export default function AdminPage() {
  const [open, setOpen] = useState(false);

  // 打开抽屉时锁定页面滚动
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // 动画 variants
  const overlayVar = {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
    exit: { opacity: 0 },
  };
  const drawerVar = {
    hidden: { x: -280 },
    show: { x: 0 },
    exit: { x: -280 },
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-800">
      {/* ======= Sidebar (Desktop) ======= */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white shadow-sm">
        <div className="p-4 border-b">
          <Link href="/" className="text-xl font-serif underline underline-offset-4">
            Rejuvenessence
          </Link>
          <p className="mt-1 text-xs text-zinc-500">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 text-sm">
          <Link href="/admin" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-zinc-100">
            <CalendarDays className="h-4 w-4" />
            Schedule
          </Link>
          <Link href="/" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-zinc-100">
            <Home className="h-4 w-4" />
            Back to site
          </Link>
        </nav>

        <div className="border-t p-4">
          <form action="/api/admin/logout" method="post">
            <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ======= Mobile Sidebar Button ======= */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden fixed top-4 left-4 z-50 rounded-lg border bg-white px-2 py-2 shadow-sm"
        aria-label="Menu"
        aria-expanded={open}
      >
        <div className="flex flex-col items-center justify-center gap-1.5">
          <span className="block h-0.5 w-5 bg-zinc-800" />
          <span className="block h-0.5 w-5 bg-zinc-800" />
          <span className="block h-0.5 w-5 bg-zinc-800" />
        </div>
      </button>

      {/* ======= Mobile Sidebar (Animated) ======= */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            variants={overlayVar}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-black/30" />
            <motion.aside
              className="absolute left-0 top-0 h-full w-64 bg-white shadow-lg p-4 flex flex-col"
              variants={drawerVar}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-serif mb-4">Rejuvenessence</h2>
              <nav className="space-y-2 text-sm flex-1">
                <Link
                  href="/admin"
                  className="block rounded-md px-3 py-2 hover:bg-zinc-100"
                  onClick={() => setOpen(false)}
                >
                  Schedule
                </Link>
                <Link
                  href="/"
                  className="block rounded-md px-3 py-2 hover:bg-zinc-100"
                  onClick={() => setOpen(false)}
                >
                  Back to site
                </Link>
              </nav>
              <form action="/api/admin/logout" method="post">
                <button className="flex items-center gap-2 rounded-md px-3 py-2 text-red-600 hover:bg-red-50 w-full">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======= Main Content ======= */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-semibold mb-4">Schedule</h1>
          <div className="rounded-xl border bg-white p-3 md:p-4 shadow-sm">
            <AdminCalendar />
          </div>
        </div>
      </main>
    </div>
  );
}