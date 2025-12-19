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
import BookingForm from "./BookingForm";
import { X } from "lucide-react";

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
};

type Props = {
  onEventClick?: (event: any) => void;
};

export default function AdminCalendar({ onEventClick }: Props) {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ✅ 监听窗口宽度
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ 获取数据
  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      setEvents(data || []);
    } catch {
      toast.error("Failed to load events");
    }
  }

  // ✅ 格式化时间
  function formatTimeRange(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    return `${s.toLocaleDateString()} ${s.toLocaleTimeString([], opts)} → ${e.toLocaleTimeString([], opts)}`;
  }

  return (
    <div className="relative w-full">
      {/* Toolbar with Add Appointment button */}
      <div className={`mb-4 flex ${isMobile ? 'flex-col gap-2' : 'justify-end'}`}>
        <button
          onClick={() => setShowAddModal(true)}
          className={`${isMobile ? 'w-full' : ''} px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-colors`}
        >
          + Add Appointment
        </button>
      </div>

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
          const event = info.event.extendedProps as BookingEvent;
          const fullEvent = {
            id: info.event.id,
            title: info.event.title,
            start: info.event.startStr,
            end: info.event.endStr,
            ...event,
          };

          if (window.innerWidth < 768) {
            // ✅ 手机端直接打开底部弹窗
            setSelectedEvent(fullEvent);
            return;
          }

          if (onEventClick) onEventClick(fullEvent);
        }}
      />

      {/* Add Appointment Modal */}
      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showAddModal && (
              <>
                <motion.div
                  className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddModal(false)}
                />

                {isMobile ? (
                  // Mobile: Bottom sheet
                  <motion.div
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.y > 100) setShowAddModal(false);
                    }}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 240, damping: 25 }}
                    className="fixed left-0 right-0 bottom-0 z-[9999]
                               bg-white rounded-t-[2rem] shadow-xl
                               p-6 max-h-[90vh] overflow-y-auto
                               pb-[env(safe-area-inset-bottom)] touch-pan-y"
                  >
                    <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300" />
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Add Appointment</h3>
                      <button
                        onClick={() => setShowAddModal(false)}
                        className="p-1 hover:bg-zinc-100 rounded"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <BookingForm
                      endpoint="/api/admin/bookings"
                      submitLabel="Create Appointment"
                      hideHoneypot={true}
                      compact={true}
                      onSuccess={(data) => {
                        toast.success("Appointment created!");
                        setShowAddModal(false);
                        loadBookings();
                      }}
                    />
                  </motion.div>
                ) : (
                  // Desktop: Centered modal
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) setShowAddModal(false);
                    }}
                  >
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">Add Appointment</h3>
                        <button
                          onClick={() => setShowAddModal(false)}
                          className="p-1 hover:bg-zinc-100 rounded"
                        >
                          <X size={24} />
                        </button>
                      </div>
                      <BookingForm
                        endpoint="/api/admin/bookings"
                        submitLabel="Create Appointment"
                        hideHoneypot={true}
                        onSuccess={(data) => {
                          toast.success("Appointment created!");
                          setShowAddModal(false);
                          loadBookings();
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Event detail modal (existing) */}
      {typeof window !== "undefined" &&
  createPortal(
    <AnimatePresence>
      {selectedEvent && isMobile && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEvent(null)}
          />

          {/* 底部弹窗 */}
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
            {/* 顶部拖拽线 */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300" />

            {/* 内容区 */}
            <div className="space-y-2 text-sm text-zinc-700">
              <h3 className="text-lg font-semibold text-zinc-900">
                {selectedEvent.title}
              </h3>

              <p>
                <strong>Name:</strong> {selectedEvent.name || "—"}
              </p>
              <p>
                <strong>Phone:</strong> {selectedEvent.phone || "—"}
              </p>
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
                <p>
                  <strong>Notes:</strong> {selectedEvent.notes}
                </p>
              )}
            </div>

            {/* 操作按钮区 */}
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
            bookingId: selectedEvent.id,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || "Failed to send deposit email");
        }

        const message = data.messageId
          ? `✅ Deposit email sent! (id: ${data.messageId})`
          : "✅ Deposit email sent!";
        toast.success(message, { id: tId });
        loadBookings();
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

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to send refusal email");

        await fetch("/api/admin/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedEvent.id, status: "cancelled" }),
        });

        toast.success("❌ Booking refused", { id: tId });
        loadBookings();
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


            {/* 关闭按钮 */}
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

    </div>
  );
}
