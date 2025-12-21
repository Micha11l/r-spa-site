"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { X, Mail, Phone, Calendar, DollarSign } from "lucide-react";
import { createPortal } from "react-dom";

type BookingEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  service_name?: string;
  deposit_cents?: number;
  deposit_paid?: boolean;
};

type AdminBookingDetailModalProps = {
  open: boolean;
  onClose: () => void;
  booking: BookingEvent | null;
  isMobile: boolean;
  onRefresh: () => void;
};

export default function AdminBookingDetailModal({
  open,
  onClose,
  booking,
  isMobile,
  onRefresh,
}: AdminBookingDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [refuseModalOpen, setRefuseModalOpen] = useState(false);
  const [refuseReason, setRefuseReason] = useState("Time slot unavailable");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("Cancelled by admin");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !refuseModalOpen && !cancelModalOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose, refuseModalOpen, cancelModalOpen]);

  if (!booking) return null;

  const statusColors: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-zinc-100 text-zinc-600",
    awaiting_deposit: "bg-blue-100 text-blue-700",
  };

  function formatDateTime(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      timeZone: "America/Toronto",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  async function handleSendDeposit() {
    const loadingId = toast.loading("Sending deposit email...");
    try {
      const res = await fetch("/api/email/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: booking.email,
          name: booking.name,
          checkoutUrl: `${window.location.origin}/pay/${booking.id}`,
          bookingId: booking.id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send email");

      toast.success("Deposit email sent!", { id: loadingId });
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to send deposit email", {
        id: loadingId,
      });
    }
  }

  async function handleRefuseConfirm() {
    const loadingId = toast.loading("Sending refusal email...");
    try {
      // Send refuse email
      const emailRes = await fetch("/api/email/refuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: booking.email,
          name: booking.name,
          reason: refuseReason.trim() || "Time slot unavailable",
        }),
      });

      const emailData = await emailRes.json();
      if (!emailRes.ok)
        throw new Error(emailData.error || "Failed to send refusal email");

      // Update booking status to cancelled
      const patchRes = await fetch("/api/admin/bookings/patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: booking.id,
          patch: {
            status: "cancelled",
            cancellation_reason: refuseReason.trim() || "Time slot unavailable",
          },
        }),
      });

      const patchData = await patchRes.json();
      if (!patchRes.ok)
        throw new Error(patchData.error || "Failed to update booking");

      toast.success("Refusal email sent", { id: loadingId });
      setRefuseModalOpen(false);
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to refuse booking", { id: loadingId });
    }
  }

  async function handleQuickStatus(newStatus: string) {
    if (newStatus === "cancelled") {
      setCancelModalOpen(true);
      return;
    }

    const loadingId = toast.loading("Updating status...");
    try {
      const res = await fetch("/api/admin/bookings/patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: booking.id,
          patch: { status: newStatus },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      toast.success("Status updated", { id: loadingId });
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to update status", { id: loadingId });
    }
  }

  async function handleCancelConfirm() {
    const loadingId = toast.loading("Cancelling booking...");
    try {
      const res = await fetch("/api/admin/bookings/patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: booking.id,
          patch: {
            status: "cancelled",
            cancellation_reason: cancelReason.trim() || "Cancelled by admin",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel booking");

      toast.success("Booking cancelled", { id: loadingId });
      setCancelModalOpen(false);
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to cancel booking", { id: loadingId });
    }
  }

  async function handleMarkVisited() {
    const loadingId = toast.loading("Marking as visited...");
    try {
      const res = await fetch("/api/admin/bookings/patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: booking.id,
          patch: { completed_at: new Date().toISOString() },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark visited");

      toast.success("Marked as visited", { id: loadingId });
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to mark as visited", { id: loadingId });
    }
  }

  async function handleReopen() {
    const loadingId = toast.loading("Reopening booking...");
    try {
      const res = await fetch("/api/admin/bookings/patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: booking.id,
          patch: { status: "pending", cancellation_reason: null },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reopen booking");

      toast.success("Booking reopened", { id: loadingId });
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to reopen booking", { id: loadingId });
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-3">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/40"
            />

            {/* Modal/Drawer Panel */}
            <motion.div
              initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
              animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }}
              exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-lg rounded-2xl bg-white border shadow-xl max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-start justify-between z-10">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold truncate">
                    Booking Details
                  </h2>
                  <p className="text-sm text-zinc-600 mt-1">
                    {booking.service_name || booking.title}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="ml-4 p-2 hover:bg-zinc-100 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      statusColors[booking.status] ||
                      "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                {/* Time Info */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-zinc-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-700">
                        Start Time
                      </p>
                      <p className="text-sm text-zinc-600">
                        {formatDateTime(booking.start)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-zinc-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-700">
                        End Time
                      </p>
                      <p className="text-sm text-zinc-600">
                        {formatDateTime(booking.end)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-zinc-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-700">
                        Customer
                      </p>
                      <p className="text-sm text-zinc-600">{booking.name}</p>
                      <p className="text-sm text-zinc-500">{booking.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-zinc-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-700">Phone</p>
                      <p className="text-sm text-zinc-600">{booking.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Deposit Info */}
                {booking.deposit_cents !== undefined && (
                  <div className="pt-2 border-t">
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-zinc-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-700">
                          Deposit
                        </p>
                        <p className="text-sm text-zinc-600">
                          CA${(booking.deposit_cents / 100).toFixed(2)}{" "}
                          {booking.deposit_paid ? (
                            <span className="text-green-600 font-medium">
                              (Paid)
                            </span>
                          ) : (
                            <span className="text-yellow-600">(Unpaid)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {booking.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-zinc-700 mb-1">
                      Notes
                    </p>
                    <p className="text-sm text-zinc-600 italic">
                      {booking.notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t space-y-3">
                  <p className="text-sm font-medium text-zinc-700">Actions</p>

                  {/* Send Deposit Email */}
                  <button
                    onClick={handleSendDeposit}
                    className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition"
                  >
                    Send Deposit Email
                  </button>

                  {/* Refuse Booking */}
                  <button
                    onClick={() => setRefuseModalOpen(true)}
                    className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                  >
                    Refuse Booking
                  </button>

                  {/* Quick Status Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Quick Status Change
                    </label>
                    <select
                      value={booking.status}
                      onChange={(e) => handleQuickStatus(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white hover:bg-zinc-50 transition cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="awaiting_deposit">Awaiting Deposit</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Additional Actions */}
                  <div className="flex flex-wrap gap-2">
                    {booking.status !== "cancelled" && (
                      <button
                        onClick={handleMarkVisited}
                        className="flex-1 px-3 py-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
                      >
                        Mark Visited
                      </button>
                    )}

                    {booking.status === "cancelled" && (
                      <button
                        onClick={handleReopen}
                        className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Refuse Modal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {refuseModalOpen && (
              <>
                <motion.div
                  className="fixed inset-0 z-[200] bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setRefuseModalOpen(false)}
                />

                <motion.div
                  className={
                    isMobile
                      ? "fixed z-[201] inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl border p-4"
                      : "fixed z-[201] left-1/2 top-1/2 w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl border p-4"
                  }
                  initial={
                    isMobile
                      ? { y: 30, opacity: 0 }
                      : { opacity: 0, scale: 0.95, y: 10 }
                  }
                  animate={
                    isMobile
                      ? { y: 0, opacity: 1 }
                      : { opacity: 1, scale: 1, y: 0 }
                  }
                  exit={
                    isMobile
                      ? { y: 30, opacity: 0 }
                      : { opacity: 0, scale: 0.95, y: 10 }
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-base font-semibold text-zinc-900">
                        Refuse Booking
                      </h4>
                      <p className="text-sm text-zinc-600 mt-1">
                        Enter reason (will be sent to customer)
                      </p>
                    </div>

                    <button
                      className="p-2 rounded-lg hover:bg-zinc-100"
                      onClick={() => setRefuseModalOpen(false)}
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <label className="block text-sm font-medium text-zinc-700 mt-4">
                    Refusal Reason
                  </label>

                  <textarea
                    value={refuseReason}
                    onChange={(e) => setRefuseReason(e.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
                    placeholder="Time slot unavailable"
                  />

                  <div className="mt-4 flex gap-2 justify-end">
                    <button
                      className="px-3 py-2 text-sm rounded-lg bg-zinc-100 hover:bg-zinc-200"
                      onClick={() => setRefuseModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                      onClick={handleRefuseConfirm}
                    >
                      Confirm Refuse
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Cancel Modal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {cancelModalOpen && (
              <>
                <motion.div
                  className="fixed inset-0 z-[200] bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setCancelModalOpen(false)}
                />

                <motion.div
                  className={
                    isMobile
                      ? "fixed z-[201] inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl border p-4"
                      : "fixed z-[201] left-1/2 top-1/2 w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl border p-4"
                  }
                  initial={
                    isMobile
                      ? { y: 30, opacity: 0 }
                      : { opacity: 0, scale: 0.95, y: 10 }
                  }
                  animate={
                    isMobile
                      ? { y: 0, opacity: 1 }
                      : { opacity: 1, scale: 1, y: 0 }
                  }
                  exit={
                    isMobile
                      ? { y: 30, opacity: 0 }
                      : { opacity: 0, scale: 0.95, y: 10 }
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-base font-semibold text-zinc-900">
                        Cancel Booking
                      </h4>
                      <p className="text-sm text-zinc-600 mt-1 truncate">
                        {booking.service_name || booking.title}
                      </p>
                    </div>

                    <button
                      className="p-2 rounded-lg hover:bg-zinc-100"
                      onClick={() => setCancelModalOpen(false)}
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <label className="block text-sm font-medium text-zinc-700 mt-4">
                    Cancellation Reason
                  </label>

                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Cancelled by admin"
                  />

                  <div className="mt-4 flex gap-2 justify-end">
                    <button
                      className="px-3 py-2 text-sm rounded-lg bg-zinc-100 hover:bg-zinc-200"
                      onClick={() => setCancelModalOpen(false)}
                    >
                      Close
                    </button>
                    <button
                      className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                      onClick={handleCancelConfirm}
                    >
                      Confirm Cancel
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
