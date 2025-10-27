// app/admin/page.tsx
"use client";

import { useState } from "react";
import AdminCalendar from "@/components/AdminCalendar";
import Link from "next/link";
import { LogOut, CalendarDays, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


export default function AdminPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* ----- Sidebar (Desktop) ----- */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white shadow-sm">
        <div className="p-4 border-b">
          <Link href="/" className="text-xl font-serif">
            Rejuvenessence
          </Link>
          <p className="mt-1 text-xs text-zinc-500">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 text-sm">
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-zinc-100"
          >
            <CalendarDays className="h-4 w-4" />
            Schedule
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-zinc-100"
          >
            <Home className="h-4 w-4" />
            Back to site
          </Link>
        </nav>

        <div className="border-t p-4">
          <button
            onClick={() => alert("Sign out clicked")}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ----- Mobile Sidebar Toggle ----- */}
      <div className="fixed top-3 left-3 z-40 md:hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border bg-white p-2 shadow-sm"
          aria-label="Menu"
        >
          <span className="block h-0.5 w-5 bg-zinc-700 mb-1"></span>
          <span className="block h-0.5 w-5 bg-zinc-700 mb-1"></span>
          <span className="block h-0.5 w-5 bg-zinc-700"></span>
        </button>
      </div>

      {/* ----- Mobile Sidebar Drawer ----- */}
      <AnimatePresence>
  {open && (
    <motion.div
      className="fixed inset-0 z-30 bg-black/30 md:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setOpen(false)}
    >
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        exit={{ x: -280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute left-0 top-0 h-full w-64 bg-white shadow-lg p-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-serif mb-4">Rejuvenessence</h2>
        <nav className="space-y-2 text-sm flex-1">
          <Link href="/admin" className="block rounded-md px-3 py-2 hover:bg-zinc-100">
            Schedule
          </Link>
          <Link href="/" className="block rounded-md px-3 py-2 hover:bg-zinc-100">
            Back to site
          </Link>
        </nav>
        <button
          onClick={() => alert("Sign out clicked")}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </motion.aside>
    </motion.div>
  )}
</AnimatePresence>


      {/* ----- Main Content (Calendar) ----- */}
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
