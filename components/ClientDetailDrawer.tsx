"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { X, Copy, Mail, Phone, Calendar } from "lucide-react";
import { createPortal } from "react-dom";

type Client = {
  email: string;
  name: string;
  phone: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  pending_bookings: number;
  visits: number;
  last_visit_at: string | null;
  next_booking_at: string | null;
  last_service_name: string | null;
  ever_deposit_paid: boolean;
  total_deposit_cents: number;
  marketing_email_opt_in: boolean;
  first_name: string | null;
  last_name: string | null;
  user_id: string | null;
};

type Booking = {
  id: string;
  service_name: string;
  start_at: string;
  end_at: string;
  status: string;
  deposit_paid: boolean;
  deposit_cents: number;
  price_cents: number;
  notes: string | null;
  created_at: string;
  payment_intent_id: string | null;
  completed_at: string | null;
  cancellation_reason: string | null;
};

type ClientDetailDrawerProps = {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  isMobile: boolean;
};

export default function ClientDetailDrawer({
  open,
  onClose,
  client,
  isMobile,
}: ClientDetailDrawerProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("Cancelled by admin");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && client?.email) {
      loadDetails(client.email);
    }
  }, [open, client?.email]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!cancelTarget) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [cancelTarget]);

  async function loadDetails(email: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/clients/details?email=${encodeURIComponent(email)}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load details");
      setBookings(data.bookings || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load details");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  }

  async function patchBooking(
    bookingId: string,
    patch: {
      status?: "pending" | "awaiting_deposit" | "confirmed" | "cancelled";
      completed_at?: string | null;
      cancellation_reason?: string | null;
    },
  ) {
    try {
      const res = await fetch("/api/admin/bookings/patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId, patch }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update booking");

      toast.success("Booking updated successfully");
      if (client?.email) {
        await loadDetails(client.email);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update booking");
    }
  }

  function openCancelModal(booking: Booking) {
    setCancelTarget(booking);
    setCancelReason(booking.cancellation_reason || "Cancelled by admin");
  }

  async function confirmCancel() {
    if (!cancelTarget) return;

    await patchBooking(cancelTarget.id, {
      status: "cancelled",
      cancellation_reason: cancelReason.trim() || "Cancelled by admin",
    });

    setCancelTarget(null);
  }

  async function handleMarkVisited(booking: Booking) {
    await patchBooking(booking.id, {
      completed_at: new Date().toISOString(),
    });
  }

  async function handleCancel(booking: Booking) {
    openCancelModal(booking);
  }

  async function handleReopen(booking: Booking) {
    await patchBooking(booking.id, {
      status: "pending",
      cancellation_reason: null,
    });
  }

  async function handleQuickStatus(booking: Booking, newStatus: string) {
    if (newStatus === "cancelled") {
      openCancelModal(booking);
      return;
    }

    await patchBooking(booking.id, {
      status: newStatus as
        | "pending"
        | "awaiting_deposit"
        | "confirmed"
        | "cancelled",
    });
  }

  if (!client) return null;

  const statusColors: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-zinc-100 text-zinc-600",
    awaiting_deposit: "bg-blue-100 text-blue-700",
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`fixed z-50 bg-white shadow-2xl ${
              isMobile
                ? "bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl overflow-y-auto"
                : "top-0 right-0 bottom-0 h-full w-full max-w-md overflow-y-auto"
            }`}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold truncate">
                  {client.name || "No name"}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-zinc-600">
                  <Mail size={14} />
                  <span className="truncate">{client.email}</span>
                  <button
                    onClick={() => copyToClipboard(client.email, "Email")}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-zinc-600">
                    <Phone size={14} />
                    <span>{client.phone}</span>
                    <button
                      onClick={() => copyToClipboard(client.phone, "Phone")}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="ml-4 p-2 hover:bg-zinc-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Stats badges */}
            <div className="px-6 py-4 border-b bg-zinc-50">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">
                  {client.visits} Visits
                </span>
                {client.pending_bookings > 0 && (
                  <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
                    {client.pending_bookings} Pending
                  </span>
                )}
                {client.cancelled_bookings > 0 && (
                  <span className="px-3 py-1.5 bg-zinc-200 text-zinc-700 rounded-lg text-sm font-medium">
                    {client.cancelled_bookings} Cancelled
                  </span>
                )}
                <span
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    client.ever_deposit_paid
                      ? "bg-green-100 text-green-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  Deposit: {client.ever_deposit_paid ? "Yes" : "No"}
                </span>
              </div>
            </div>

            {/* Bookings list */}
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-2">
                <Calendar size={16} />
                Recent Bookings ({bookings.length})
              </h3>

              {loading ? (
                <div className="text-center py-8 text-zinc-500">Loading...</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  No bookings found
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border rounded-lg p-3 hover:border-emerald-300 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">
                            {booking.service_name}
                          </h4>
                          <p className="text-sm text-zinc-600 mt-0.5">
                            {new Date(booking.start_at).toLocaleString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                              statusColors[booking.status] ||
                              "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {booking.status}
                          </span>
                          {booking.completed_at && (
                            <span className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap bg-emerald-100 text-emerald-700">
                              Visited
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-600">
                        {booking.price_cents > 0 && (
                          <span>
                            CA${(booking.price_cents / 100).toFixed(2)}
                          </span>
                        )}
                        {booking.deposit_paid && (
                          <span className="text-green-600 font-medium">
                            Deposit: CA$
                            {(booking.deposit_cents / 100).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {booking.notes && (
                        <p className="text-xs text-zinc-500 mt-2 italic">
                          {booking.notes}
                        </p>
                      )}

                      {booking.cancellation_reason && (
                        <p className="text-xs text-red-600 mt-2">
                          <span className="font-medium">Reason:</span>{" "}
                          {booking.cancellation_reason}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                        {/* Mark Visited */}
                        {booking.status !== "cancelled" &&
                          !booking.completed_at && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkVisited(booking);
                              }}
                              className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition"
                            >
                              Mark Visited
                            </button>
                          )}

                        {/* Cancel */}
                        {booking.status !== "cancelled" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancel(booking);
                            }}
                            className="px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition"
                          >
                            Cancel
                          </button>
                        )}

                        {/* Reopen */}
                        {booking.status === "cancelled" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReopen(booking);
                            }}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition"
                          >
                            Reopen
                          </button>
                        )}

                        {/* Quick Status Selector */}
                        <select
                          value={booking.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newStatus = e.target.value;
                            if (newStatus !== booking.status) {
                              handleQuickStatus(booking, newStatus);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 text-xs border rounded bg-white hover:bg-zinc-50 transition cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="awaiting_deposit">
                            Awaiting Deposit
                          </option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Cancel Modal via Portal (prevents transform/overflow clipping on mobile) */}
          {mounted &&
            createPortal(
              <AnimatePresence>
                {cancelTarget && (
                  <>
                    <motion.div
                      className="fixed inset-0 z-[200] bg-black/40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setCancelTarget(null)}
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
                            Cancel booking
                          </h4>
                          <p className="text-sm text-zinc-600 mt-1 truncate">
                            {cancelTarget.service_name}
                          </p>
                        </div>

                        <button
                          className="p-2 rounded-lg hover:bg-zinc-100"
                          onClick={() => setCancelTarget(null)}
                          aria-label="Close"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <label className="block text-sm font-medium text-zinc-700 mt-4">
                        Reason
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
                          onClick={() => setCancelTarget(null)}
                        >
                          Close
                        </button>
                        <button
                          className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                          onClick={confirmCancel}
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
      )}
    </AnimatePresence>
  );
}
