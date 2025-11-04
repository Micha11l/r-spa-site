//app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Home, LogOut } from "lucide-react";
import AdminCalendar from "@/components/AdminCalendar";
import toast from "react-hot-toast";

type Booking = {
  id: string;
  service_name: string;
  name: string;
  email: string;
  phone: string;
  start: string;
  end: string;
  status: string;
};

export default function AdminPage() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Booking[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    type: "deposit" | "refuse";
    booking: Booking;
  } | null>(null);

  // 🔒 Prevent background scroll when mobile drawer open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // 📦 Load pending bookings
  useEffect(() => {
    refreshPending();
  }, []);

  async function refreshPending() {
    try {
      const res = await fetch("/api/admin/bookings?status=pending");
      const data = await res.json();
      setPending(data || []);
    } catch {
      toast.error("Failed to load bookings");
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/admin/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) throw new Error("Failed to update booking status");
  }

  async function handleSendDeposit(b: Booking) {
    const loadingId = toast.loading("Sending deposit email...");
    try {
      const res = await fetch("/api/email/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: b.email,
          name: b.name,
          checkoutUrl: `${window.location.origin}/pay/${b.id}`,
          bookingId: b.id,
        }),
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
  
      await updateStatus(b.id, "awaiting_deposit");
      toast.success("Deposit email sent!", { id: loadingId });
      refreshPending();
    } catch (e: any) {
      toast.error(e.message || "Failed to send deposit email", { id: loadingId });
    } finally {
      setConfirmModal(null);
    }
  }
  
  async function handleRefuse(b: Booking) {
    const loadingId = toast.loading("Sending refusal email...");
    try {
      const res = await fetch("/api/email/refuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: b.email,
          name: b.name,
          reason: "Time slot unavailable",
        }),
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send refusal email");
  
      await updateStatus(b.id, "cancelled");
      toast.success("Refusal email sent.", { id: loadingId });
      refreshPending();
    } catch (e: any) {
      toast.error(e.message || "Failed to send refusal email", { id: loadingId });
    } finally {
      setConfirmModal(null);
    }
  }
  

  const overlayVar = { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } };
  const drawerVar = { hidden: { x: -280 }, show: { x: 0 }, exit: { x: -280 } };

  // ✨ 新增 Modal 动画配置
  const modalVar = {
    hidden: { opacity: 0, scale: 0.9, y: 40 },
    show: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 22 },
    },
    exit: { opacity: 0, scale: 0.9, y: 40 },
  };

  const handleEventClick = (booking: any) => {
    if (window.innerWidth < 768) return;
    setConfirmModal({ type: "deposit", booking});
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-800">
      {/* Sidebar (Desktop)
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
      </aside> */}

      {/* Mobile Sidebar */}
      {/* <button
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
      </button> */}

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            variants={overlayVar}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
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
                <Link href="/admin" className="block rounded-md px-3 py-2 hover:bg-zinc-100" onClick={() => setOpen(false)}>
                  Schedule
                </Link>
                <Link href="/" className="block rounded-md px-3 py-2 hover:bg-zinc-100" onClick={() => setOpen(false)}>
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

      {/* Main */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-8">
          <h1 className="text-2xl font-semibold mb-4">Schedule</h1>
          <div className="rounded-xl border bg-white p-3 md:p-4 shadow-sm">
            <AdminCalendar
              onEventClick={(event: any) =>
                setConfirmModal({ type: "deposit", booking: event.extendedProps })
              }
            />
          </div>

          {/* Pending list */}
          <section className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Pending Bookings</h2>
            {pending.length === 0 && <p className="text-sm text-zinc-500">No pending bookings.</p>}
            <ul className="space-y-3">
              {pending.map((b) => (
                <li
                  key={b.id}
                  className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{b.service_name}</p>
                    <p className="text-sm text-zinc-500">
                      {b.name} · {b.phone}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => setConfirmModal({ type: "deposit", booking: b })}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Send Deposit Email
                    </button>
                    <button
                      onClick={() => setConfirmModal({ type: "refuse", booking: b })}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Refuse Booking
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      {/* ✨ Animated Modal */}
{/* ✨ Animated Modal */}
<AnimatePresence>
  {confirmModal && (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 背景遮罩 */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setConfirmModal(null)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* 主体框 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { type: "spring", stiffness: 260, damping: 22 },
        }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="relative bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-sm z-10"
      >
        <h3 className="text-lg font-semibold mb-2">
          {confirmModal?.type === "deposit"
            ? "Send Deposit Email?"
            : "Refuse this booking?"}
        </h3>
        <p className="text-sm text-zinc-600 mb-4">
            {confirmModal?.booking
              ? `${confirmModal.booking.name} - ${confirmModal.booking.service_name}`
            : "No booking selected"
            }
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setConfirmModal(null)}
            className="px-3 py-1.5 text-sm rounded-md bg-zinc-100 hover:bg-zinc-200"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              confirmModal.type === "deposit"
                ? handleSendDeposit(confirmModal.booking)
                : handleRefuse(confirmModal.booking)
            }
            className={`px-3 py-1.5 text-sm rounded-md text-white ${
              confirmModal.type === "deposit"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            Confirm
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

    </div>
    
  );
}
