// app/admin/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import AdminCalendar from "@/components/AdminCalendar";

/** =========================
 * Types
 * =======================*/
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

type ClassRow = {
  id: string;
  class_type: "stretching" | "yoga" | "pilates";
  class_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  capacity: number;
  min_size: number;
  status: "scheduled" | "cancelled" | "completed";
  coach?: string | null;
  room?: string | null;
  signed_count: number;
};

type Roster = {
  class: ClassRow;
  roster: {
    id: string;
    full_name: string | null;
    email: string;
    status: "signed" | "withdrawn";
    created_at: string;
  }[];
};

const CLASS_TYPES = [
  { value: "all", label: "All types" },
  { value: "stretching", label: "Stretching" },
  { value: "yoga", label: "Yoga" },
  { value: "pilates", label: "Pilates" },
] as const;

/** =========================
 * Component
 * =======================*/
export default function AdminPage() {
  /** ------------ Pending bookings ------------ */
  const [pending, setPending] = useState<Booking[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    type: "deposit" | "refuse";
    booking: Booking;
  } | null>(null);

  // refresh calendar if needed later
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const triggerCalendarRefresh = () => setCalendarRefreshKey((k) => k + 1);

  useEffect(() => {
    refreshPending();
  }, []);

  async function refreshPending() {
    try {
      const res = await fetch("/api/admin/bookings?status=pending", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        throw new Error(data?.error || "Failed to load bookings");
      }
      setPending(data);
    } catch (err: any) {
      console.error("[AdminPage] refreshPending", err);
      toast.error(err?.message || "Failed to load bookings");
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/admin/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) throw new Error(await res.text());
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
      toast.success("Deposit email sent", { id: loadingId });
      await refreshPending();
      triggerCalendarRefresh();
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
      await refreshPending();
      triggerCalendarRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to send refusal email", { id: loadingId });
    } finally {
      setConfirmModal(null);
    }
  }

  /** ------------ Small-group classes (Admin) ------------ */
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [clsDate, setClsDate] = useState<string>(todayISO);
  const [clsType, setClsType] = useState<"all" | ClassRow["class_type"]>("all");
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [rosterDrawer, setRosterDrawer] = useState<{ open: boolean; data?: Roster }>({
    open: false,
  });

  async function loadClasses() {
    setLoadingClasses(true);
    try {
      const qs = new URLSearchParams({ date: clsDate });
      if (clsType !== "all") qs.set("type", clsType);

      const resp = await fetch(`/api/admin/classes?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Failed to load classes");

      // 显示全部（不要过滤 signed_count>0）
      setClasses((data ?? []) as ClassRow[]);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to load classes");
    } finally {
      setLoadingClasses(false);
    }
  }

  useEffect(() => {
    loadClasses();
  }, [clsDate, clsType]);

  function isRoster(payload: any): payload is Roster {
    return (
      payload &&
      typeof payload === "object" &&
      payload.class &&
      typeof payload.class === "object" &&
      typeof payload.class.id === "string" &&
      Array.isArray(payload.roster)
    );
  }

  async function openRoster(id: string) {
    const t = toast.loading("Loading roster…");
    try {
      const resp = await fetch(`/api/admin/classes/roster?class_id=${id}`);
      const data = await resp.json();

      if (!resp.ok) throw new Error(data?.error || "Failed to load roster");
      if (!isRoster(data)) throw new Error("Invalid roster payload");

      setRosterDrawer({ open: true, data });
      toast.dismiss(t);
    } catch (e: any) {
      toast.error(e.message || "Failed to load roster", { id: t });
    }
  }

  async function sendReminder(id: string) {
    const t = toast.loading("Sending reminders…");
    try {
      const res = await fetch("/api/admin/classes/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reminders");
      toast.success(`Reminders sent to ${data.sent} sign-ups`, { id: t });
    } catch (e: any) {
      toast.error(e.message || "Failed to send reminders", { id: t });
    }
  }

  async function patchClass(id: string, patch: Partial<ClassRow>) {
    const res = await fetch("/api/admin/classes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
  }

  async function cancelClass(id: string) {
    const t = toast.loading("Cancelling…");
    try {
      await patchClass(id, { status: "cancelled" });
      await loadClasses();
      toast.success("Class cancelled", { id: t });
    } catch (e: any) {
      toast.error(e.message || "Cancel failed", { id: t });
    }
  }

  async function restoreClass(id: string) {
    const t = toast.loading("Restoring…");
    try {
      await patchClass(id, { status: "scheduled" });
      await loadClasses();
      toast.success("Class restored", { id: t });
    } catch (e: any) {
      toast.error(e.message || "Restore failed", { id: t });
    }
  }

  async function bumpCapacity(id: string, delta: number) {
    const row = classes.find((c) => c.id === id);
    if (!row) return;
    const next = Math.max(row.signed_count, (row.capacity || 0) + delta);
    const t = toast.loading("Updating capacity…");
    try {
      await patchClass(id, { capacity: next });
      await loadClasses();
      toast.success("Capacity updated", { id: t });
    } catch (e: any) {
      toast.error(e.message || "Update failed", { id: t });
    }
  }

  /** =========================
   * Render
   * =======================*/
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800">
      <main className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8 space-y-8">
        {/* ===== Schedule（桌面端仅展示详情，无 send/refuse） ===== */}
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h1 className="text-2xl font-semibold mb-4">Schedule</h1>
          {/* calendarRefreshKey is available if you later wire it through to AdminCalendar */}
          <AdminCalendar />
        </section>

        {/* ===== Pending Bookings（操作区仅在这里） ===== */}
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Pending Bookings</h2>
            <button
              onClick={refreshPending}
              className="rounded-md bg-zinc-900 text-white px-3 py-1.5 text-sm hover:bg-zinc-800"
            >
              Refresh
            </button>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-zinc-500">No pending bookings.</p>
          ) : (
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
          )}
        </section>

        {/* ===== Small-group Classes (Admin) ===== */}
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-3 items-end justify-between">
            <h2 className="text-lg font-semibold">Small-group Classes (Admin)</h2>
            <div className="flex gap-2 items-center">
              <select
                value={clsType}
                onChange={(e) => setClsType(e.target.value as ClassRow["class_type"] | "all")}
                className="h-9 rounded-md border px-2 text-sm"
              >
                {CLASS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={clsDate}
                onChange={(e) => setClsDate(e.target.value)}
                className="h-9 rounded-md border px-2 text-sm"
              />
              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -1 }}
                onClick={async () => {
                  if (!classes.length) return toast("No classes to remind");
                  const t = toast.loading("Sending reminders…");
                  try {
                    for (const c of classes) {
                      await fetch("/api/admin/classes/remind", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ class_id: c.id }),
                      });
                    }
                    toast.success("Reminders queued for visible classes", { id: t });
                  } catch (e: any) {
                    toast.error(e.message || "Failed to send some reminders", { id: t });
                  }
                }}
                className="h-9 rounded-md border px-3 text-sm hover:bg-zinc-50"
              >
                Remind all (this list)
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -1 }}
                onClick={loadClasses}
                className="h-9 rounded-md bg-zinc-900 text-white px-3 text-sm hover:bg-zinc-800"
              >
                {loadingClasses ? "Loading…" : "Refresh"}
              </motion.button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="py-2 pr-3">Time</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Signed</th>
                  <th className="py-2 pr-3">Capacity</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {loadingClasses
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <motion.tr
                          key={`sk-${i}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <td colSpan={6} className="py-3">
                            <div className="h-6 w-full animate-pulse bg-zinc-100 rounded" />
                          </td>
                        </motion.tr>
                      ))
                    : classes.length === 0
                    ? (
                      <motion.tr
                        key="empty"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                      >
                        <td colSpan={6} className="py-6 text-center text-zinc-500">
                          No classes.
                        </td>
                      </motion.tr>
                    )
                    : classes.map((c) => {
                        const time = `${c.start_time.slice(0, 5)}–${c.end_time.slice(0, 5)}`;
                        const remaining = Math.max(0, c.capacity - c.signed_count);
                        const canRestore = c.status === "cancelled";
                        return (
                          <motion.tr
                            key={c.id}
                            className="border-t"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ type: "spring", stiffness: 260, damping: 22 }}
                          >
                            <td className="py-2 pr-3">{time}</td>
                            <td className="py-2 pr-3 capitalize">{c.class_type}</td>
                            <td className="py-2 pr-3">
                              {c.signed_count}/{c.capacity}{" "}
                              <span className="text-xs text-zinc-500">(left {remaining})</span>
                            </td>
                            <td className="py-2 pr-3">
                              <div className="inline-flex items-center gap-1">
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => bumpCapacity(c.id, -1)}
                                  className="h-6 w-6 grid place-items-center rounded border hover:bg-zinc-100"
                                  title="Decrease"
                                >
                                  −
                                </motion.button>
                                <span className="px-2">{c.capacity}</span>
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => bumpCapacity(c.id, +1)}
                                  className="h-6 w-6 grid place-items-center rounded border hover:bg-zinc-100"
                                  title="Increase"
                                >
                                  +
                                </motion.button>
                              </div>
                            </td>
                            <td className="py-2 pr-3">
                              <span
                                className={
                                  c.status === "cancelled"
                                    ? "text-red-600 font-medium"
                                    : c.signed_count >= c.min_size
                                    ? "text-green-600 font-medium"
                                    : "text-yellow-600 font-medium"
                                }
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="py-2 pr-3">
                              <div className="flex flex-wrap gap-2">
                                <motion.button
                                  whileTap={{ scale: 0.98 }}
                                  whileHover={{ y: -1 }}
                                  onClick={() => openRoster(c.id)}
                                  className="rounded-md border px-2 py-1 hover:bg-zinc-50"
                                >
                                  Roster
                                </motion.button>
                                <motion.button
                                  whileTap={{ scale: 0.98 }}
                                  whileHover={{ y: -1 }}
                                  onClick={() => sendReminder(c.id)}
                                  className="rounded-md border px-2 py-1 hover:bg-zinc-50"
                                >
                                  Send reminder
                                </motion.button>
                                {canRestore ? (
                                  <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    whileHover={{ y: -1 }}
                                    onClick={() => restoreClass(c.id)}
                                    className="rounded-md border px-2 py-1 hover:bg-zinc-50"
                                  >
                                    Restore
                                  </motion.button>
                                ) : (
                                  <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    whileHover={{ y: -1 }}
                                    onClick={() => cancelClass(c.id)}
                                    className="rounded-md border px-2 py-1 hover:bg-zinc-50"
                                  >
                                    Cancel
                                  </motion.button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ===== Confirm modal for pending list ===== */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setConfirmModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              className="relative bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-sm z-10"
            >
              <h3 className="text-lg font-semibold mb-2">
                {confirmModal.type === "deposit" ? "Send Deposit Email?" : "Refuse this booking?"}
              </h3>
              <p className="text-sm text-zinc-600 mb-4">
                {confirmModal.booking.name} — {confirmModal.booking.service_name}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-3 py-1.5 text-sm rounded-md bg-zinc-100 hover:bg-zinc-200"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
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

      {/* ===== Roster drawer ===== */}
      <AnimatePresence>
        {rosterDrawer.open && rosterDrawer.data && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRosterDrawer({ open: false })}
            />
            <motion.aside
              className="fixed right-0 top-0 bottom-0 z-[61] w-full md:w-[420px] bg-white border-l p-6 overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Roster</h3>
                  <p className="text-sm text-zinc-600">
                    {rosterDrawer.data.class.class_type} · {rosterDrawer.data.class.class_date} ·{" "}
                    {rosterDrawer.data.class.start_time.slice(0, 5)}–
                    {rosterDrawer.data.class.end_time.slice(0, 5)}
                  </p>
                </div>
                <button
                  onClick={() => setRosterDrawer({ open: false })}
                  className="rounded p-2 text-zinc-500 hover:bg-zinc-100"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4">
                {rosterDrawer.data.roster.length === 0 ? (
                  <p className="text-sm text-zinc-500">No sign-ups yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {rosterDrawer.data.roster.map((r) => (
                      <li key={r.id} className="rounded border p-2 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{r.full_name || "—"}</p>
                          <p className="text-xs text-zinc-500">{r.email}</p>
                        </div>
                        <span
                          className={r.status === "signed" ? "text-green-600 text-sm" : "text-zinc-500 text-sm"}
                        >
                          {r.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6">
                <div className="mb-3">
                  <button
                    onClick={() => {
                      const emails = rosterDrawer.data!.roster.map((r) => r.email).join(", ");
                      navigator.clipboard.writeText(emails);
                      toast.success("Emails copied");
                    }}
                    className="w-full rounded-md border py-2 text-sm hover:bg-zinc-50"
                  >
                    Copy all emails
                  </button>
                </div>
                <button
                  onClick={() => sendReminder(rosterDrawer.data!.class.id)}
                  className="w-full rounded-md bg-zinc-900 text-white py-2 text-sm hover:bg-zinc-800"
                >
                  Send reminder to all
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}