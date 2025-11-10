"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

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

  price_cents?: number | null;
  deposit_cents?: number | null;
  deposit_paid?: boolean | null;
  deposit_paid_at?: string | null;
  payment_intent_id?: string | null;
  refund_cents?: number | null;
  refund_status?: string | null;
};

type Props = {
  onEventClick?: (event: BookingEvent) => void;
};

function formatCents(c?: number | null) {
  if (c === null || c === undefined) return "—";
  return `$${(c / 100).toFixed(2)}`;
}
function fmtDate(dt?: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function AdminCalendar({ onEventClick }: Props) {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await fetch("/api/admin/bookings");
        const data = await res.json();
        setEvents(data || []);
      } catch {
        toast.error("Failed to load events");
      }
    }
    loadBookings();
  }, []);

  return (
    <div className="relative w-full">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={isMobile ? "listWeek" : "dayGridMonth"}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: isMobile ? "" : "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height="auto"
        events={events}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        views={{
          listWeek: {
            listDayFormat: { weekday: "short", month: "short", day: "numeric" },
            listDaySideFormat: false,
          },
        }}
        eventClick={(info) => {
          const ext = (info.event.extendedProps || {}) as Partial<BookingEvent>;
          const fullEvent: BookingEvent = {
            id: info.event.id,
            title: info.event.title || (ext.title as string) || "",
            start: info.event.startStr,
            end: info.event.endStr,
            status: (ext.status as string) || "pending",
            name: (ext.name as string) || "",
            email: (ext.email as string) || "",
            phone: (ext.phone as string) || "",
            notes: (ext.notes as string) || "",

            price_cents: (ext.price_cents as number) ?? null,
            deposit_cents: (ext.deposit_cents as number) ?? null,
            deposit_paid: (ext.deposit_paid as boolean) ?? null,
            deposit_paid_at: (ext.deposit_paid_at as string) ?? null,
            payment_intent_id: (ext.payment_intent_id as string) ?? null,
            refund_cents: (ext.refund_cents as number) ?? null,
            refund_status: (ext.refund_status as string) ?? null,
          };

          if (window.innerWidth < 768) {
            setSelectedEvent(fullEvent);
            return;
          }
          // Desktop: also open the modal, but still notify parent if provided
          setSelectedEvent(fullEvent);
          if (onEventClick) onEventClick(fullEvent);
        }}
      />

      {/* ✅ 移动端底部滑出详情（含金额/定金状态 & 操作按钮） */}
      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedEvent && isMobile && (
              <>
                <motion.div
                  className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedEvent(null)}
                />

                <motion.div
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.y > 100) setSelectedEvent(null);
                  }}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 240, damping: 25 }}
                  className="fixed left-0 right-0 bottom-0 z-[9999]
                       bg-white rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.1)]
                       p-6 max-h-[85vh] overflow-y-auto
                       pb-[env(safe-area-inset-bottom)] touch-pan-y"
                >
                  <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300" />

                  <div className="space-y-2 text-sm text-zinc-700">
                    <h3 className="text-lg font-semibold text-zinc-900">
                      {selectedEvent.title}
                    </h3>

                    <p><strong>Name:</strong> {selectedEvent.name || "—"}</p>
                    <p><strong>Phone:</strong> {selectedEvent.phone || "—"}</p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        className={
                          selectedEvent.status === "confirmed"
                            ? "text-green-600"
                            : selectedEvent.status === "pending"
                            ? "text-yellow-600"
                            : "text-zinc-500"
                        }
                      >
                        {selectedEvent.status}
                      </span>
                    </p>
                    <p>
                      <strong>Time:</strong>{" "}
                      {new Date(selectedEvent.start).toLocaleString()} →{" "}
                      {new Date(selectedEvent.end).toLocaleTimeString()}
                    </p>
                    {selectedEvent.notes && (
                      <p><strong>Notes:</strong> {selectedEvent.notes}</p>
                    )}

                    {/* 💰 金额/定金信息 */}
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                      <div><span className="font-medium">Total:</span> {formatCents(selectedEvent.price_cents)}</div>
                      <div><span className="font-medium">Deposit:</span> {formatCents(selectedEvent.deposit_cents)}</div>
                      <div>
                        <span className="font-medium">Deposit Status:</span>{" "}
                        {selectedEvent.deposit_paid ? "Paid" : "Unpaid"}
                      </div>
                      <div>
                        <span className="font-medium">Paid At:</span>{" "}
                        {fmtDate(selectedEvent.deposit_paid_at)}
                      </div>
                      {selectedEvent.payment_intent_id ? (
                        <div className="col-span-2 truncate">
                          <span className="font-medium">Payment Intent:</span>{" "}
                          {selectedEvent.payment_intent_id}
                        </div>
                      ) : null}
                      {selectedEvent.refund_cents ? (
                        <>
                          <div>
                            <span className="font-medium">Refund:</span>{" "}
                            {formatCents(selectedEvent.refund_cents)}
                          </div>
                          <div>
                            <span className="font-medium">Refund Status:</span>{" "}
                            {selectedEvent.refund_status || "—"}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* 操作按钮（移动端保留） */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={async () => {
                        const tId = toast.loading("Sending deposit email...");
                        try {
                          const checkoutUrl = `${window.location.origin}/pay/${selectedEvent.id}`;

                          const res = await fetch("/api/email/deposit", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              to: selectedEvent.email,
                              name: selectedEvent.name,
                              checkoutUrl,
                            }),
                          });

                          const msg = await res.text();
                          if (!res.ok)
                            throw new Error(msg || "Failed to send deposit email");

                          const upd = await fetch("/api/admin/update", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              id: selectedEvent.id,
                              status: "deposit_sent",
                            }),
                          });

                          if (!upd.ok) {
                            const emsg = await upd.text();
                            throw new Error(
                              emsg || "Failed to update status to deposit_sent"
                            );
                          }

                          toast.success("✅ Deposit email sent!", { id: tId });
                        } catch (e: any) {
                          toast.error(`❌ ${e.message}`, { id: tId });
                        } finally {
                          setSelectedEvent(null);
                        }
                      }}
                      className="flex-1 rounded-md bg-green-600 hover:bg-green-700 text-white py-2 text-sm font-medium shadow-sm active:scale-95"
                    >
                      ✅ Send Deposit Email
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={async () => {
                        const tId = toast.loading("Sending refusal...");
                        try {
                          const res = await fetch("/api/email/refuse", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              to: selectedEvent.email,
                              name: selectedEvent.name,
                            }),
                          });

                          const msg = await res.text();
                          if (!res.ok)
                            throw new Error(msg || "Failed to send refusal email");

                          const upd = await fetch("/api/admin/update", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              id: selectedEvent.id,
                              status: "cancelled",
                            }),
                          });

                          if (!upd.ok) {
                            const emsg = await upd.text();
                            throw new Error(emsg || "Failed to update status");
                          }

                          toast.success("❌ Booking refused", { id: tId });
                        } catch (e: any) {
                          toast.error(`⚠️ ${e.message}`, { id: tId });
                        } finally {
                          setSelectedEvent(null);
                        }
                      }}
                      className="flex-1 rounded-md bg-red-600 hover:bg-red-700 text-white py-2 text-sm font-medium shadow-sm active:scale-95"
                    >
                      ❌ Refuse Booking
                    </motion.button>
                  </div>

                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* ✅ 桌面端弹窗（保留手机端不变；添加动画） */}
      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedEvent && !isMobile && (
              <>
                {/* Overlay */}
                <motion.div
                  className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedEvent(null)}
                />

                {/* Modal */}
                <motion.div
                  className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                >
                  <div className="relative w-[min(640px,92vw)] max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-semibold text-zinc-900">{selectedEvent.title}</h3>
                      <button
                        onClick={() => setSelectedEvent(null)}
                        className="shrink-0 rounded-md px-2 py-1 text-sm text-zinc-500 hover:text-zinc-700"
                        aria-label="Close"
                      >✕</button>
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-zinc-700">
                      <p><span className="text-zinc-500">Name:</span> {selectedEvent.name || "—"}</p>
                      <p><span className="text-zinc-500">Phone:</span> {selectedEvent.phone || "—"}</p>
                      <p>
                        <span className="text-zinc-500">Status:</span>{" "}
                        <span className={
                          selectedEvent.status === "confirmed"
                            ? "text-green-600"
                            : selectedEvent.status === "pending"
                            ? "text-yellow-600"
                            : "text-zinc-500"
                        }>
                          {selectedEvent.status}
                        </span>
                      </p>
                      <p>
                        <span className="text-zinc-500">Time:</span>{" "}
                        {new Date(selectedEvent.start).toLocaleString()} → {new Date(selectedEvent.end).toLocaleTimeString()}
                      </p>
                      {selectedEvent.notes && (
                        <p><span className="text-zinc-500">Notes:</span> {selectedEvent.notes}</p>
                      )}

                      {/* 金额/定金信息（与移动端一致） */}
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                        <div><span className="font-medium">Total:</span> {formatCents(selectedEvent.price_cents)}</div>
                        <div><span className="font-medium">Deposit:</span> {formatCents(selectedEvent.deposit_cents)}</div>
                        <div>
                          <span className="font-medium">Deposit Status:</span>{" "}
                          {selectedEvent.deposit_paid ? "Paid" : "Unpaid"}
                        </div>
                        <div>
                          <span className="font-medium">Paid At:</span>{" "}
                          {fmtDate(selectedEvent.deposit_paid_at)}
                        </div>
                        {selectedEvent.payment_intent_id ? (
                          <div className="col-span-2 truncate">
                            <span className="font-medium">Payment Intent:</span> {selectedEvent.payment_intent_id}
                          </div>
                        ) : null}
                        {selectedEvent.refund_cents ? (
                          <>
                            <div><span className="font-medium">Refund:</span> {formatCents(selectedEvent.refund_cents)}</div>
                            <div><span className="font-medium">Refund Status:</span> {selectedEvent.refund_status || "—"}</div>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* 操作按钮（桌面端同样提供） */}
                    <div className="mt-6 flex flex-wrap gap-3 justify-end">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                          const tId = toast.loading("Sending deposit email...");
                          try {
                            const checkoutUrl = `${window.location.origin}/pay/${selectedEvent.id}`;
                            const res = await fetch("/api/email/deposit", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                to: selectedEvent.email,
                                name: selectedEvent.name,
                                checkoutUrl,
                              }),
                            });
                            const msg = await res.text();
                            if (!res.ok) throw new Error(msg || "Failed to send deposit email");

                            const upd = await fetch("/api/admin/update", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: selectedEvent.id, status: "deposit_sent" }),
                            });
                            if (!upd.ok) throw new Error((await upd.text()) || "Failed to update status");

                            toast.success("✅ Deposit email sent!", { id: tId });
                          } catch (e: any) {
                            toast.error(`❌ ${e.message}`, { id: tId });
                          } finally {
                            setSelectedEvent(null);
                          }
                        }}
                        className="rounded-md bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium shadow-sm"
                      >
                        ✅ Send Deposit Email
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                          const tId = toast.loading("Sending refusal...");
                          try {
                            const res = await fetch("/api/email/refuse", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ to: selectedEvent.email, name: selectedEvent.name }),
                            });
                            const msg = await res.text();
                            if (!res.ok) throw new Error(msg || "Failed to send refusal email");

                            const upd = await fetch("/api/admin/update", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: selectedEvent.id, status: "cancelled" }),
                            });
                            if (!upd.ok) throw new Error((await upd.text()) || "Failed to update status");

                            toast.success("❌ Booking refused", { id: tId });
                          } catch (e: any) {
                            toast.error(`⚠️ ${e.message}`, { id: tId });
                          } finally {
                            setSelectedEvent(null);
                          }
                        }}
                        className="rounded-md bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium shadow-sm"
                      >
                        ❌ Refuse Booking
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}