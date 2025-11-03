"use client";

import dynamic from "next/dynamic";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

import type {
  CalendarOptions,
  EventInput,
  PluginDef,
  DatesSetArg,
  EventClickArg,
} from "@fullcalendar/core";

import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";

const FullCalendar = dynamic<CalendarOptions>(
  () => import("@fullcalendar/react").then((m) => m.default),
  { ssr: false }
);

dayjs.extend(utc);
dayjs.extend(tz);

const TZ = process.env.NEXT_PUBLIC_TZ || "America/Toronto";

type Booking = {
  id?: string;
  service_name: string;
  start_ts: string;
  end_ts: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
  status?: "pending" | "confirmed" | "cancelled";
};

function statusColor(s?: Booking["status"]) {
  switch (s) {
    case "confirmed":
      return "#16a34a";
    case "cancelled":
      return "#ef4444";
    default:
      return "#f59e0b";
  }
}

function toTZ(iso?: string) {
  if (!iso) return undefined;
  return dayjs(iso).tz(TZ).toISOString();
}

export default function AdminCalendar() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rangeRef = useRef<{ fromISO: string; toISO: string } | null>(null);

  const events: EventInput[] = useMemo(
    () =>
      items.map((b) => ({
        id: b.id || `${b.customer_email ?? b.customer_phone}-${b.start_ts}`,
        title: `${b.service_name} · ${b.customer_name}`,
        start: toTZ(b.start_ts || (b as any).start),
        end: toTZ(b.end_ts || (b as any).end),
        allDay: false, // ✅ 关键：确保 day/week 视图按时间段显示
        backgroundColor: statusColor(b.status),
        borderColor: statusColor(b.status),
        textColor: "#111",
        display: "block",
        extendedProps: {
          status: b.status,
          phone: b.customer_phone,
          email: b.customer_email,
          notes: b.notes,
        },
      })),
    [items]
  );

  const fetchRange = useCallback(async (fromISO: string, toISO: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = new URL("/api/admin/bookings", window.location.origin);
      url.searchParams.set("from", fromISO);
      url.searchParams.set("to", toISO);

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();

      setItems(
        (Array.isArray(j) ? j : j.items || []).map((r: any) => ({
          id: r.id,
          service_name: r.title?.replace(/\s*\(cancelled\)$/, "") ?? "",
          start_ts: r.start,
          end_ts: r.end,
          customer_name: r.name ?? "",
          customer_phone: r.phone ?? "",
          notes: r.notes ?? "",
          status: r.status ?? "pending",
        }))
      );
    } catch (e: any) {
      console.error("[admin calendar] load error", e);
      setItems([]);
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fromISO = dayjs().startOf("month").tz(TZ).toISOString();
    const toISO = dayjs().endOf("month").tz(TZ).toISOString();
    rangeRef.current = { fromISO, toISO };
    fetchRange(fromISO, toISO);
  }, [fetchRange]);

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const fromISO = dayjs(arg.start).tz(TZ).toISOString();
      const toISO = dayjs(arg.end).tz(TZ).toISOString();
      rangeRef.current = { fromISO, toISO };
      fetchRange(fromISO, toISO);
    },
    [fetchRange]
  );

  useEffect(() => {
    const id = setInterval(() => {
      if (rangeRef.current) {
        const { fromISO, toISO } = rangeRef.current;
        fetchRange(fromISO, toISO);
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [fetchRange]);

  useEffect(() => {
    const onFocus = () => {
      if (rangeRef.current) {
        const { fromISO, toISO } = rangeRef.current;
        fetchRange(fromISO, toISO);
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchRange]);

  const handleEventClick = useCallback((info: EventClickArg) => {
    const ev = info.event;
    const start = ev.start ? dayjs(ev.start).tz(TZ).format("MMM D, h:mm A") : "";
    const end = ev.end ? dayjs(ev.end).tz(TZ).format("h:mm A") : "";
    const p = ev.extendedProps as any;
    const lines = [
      ev.title,
      `${start} - ${end}`,
      p?.status ? `Status: ${p.status}` : "",
      p?.phone ? `Phone: ${p.phone}` : "",
      p?.email ? `Email: ${p.email}` : "",
      p?.notes ? `Notes: ${p.notes}` : "",
    ].filter(Boolean);
    alert(lines.join("\n"));
  }, []);

  return (
    <div className="rounded-xl border bg-white p-3 md:p-4">
      {/* 图例 */}
      <div className="mb-3 flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center gap-2">
          <i
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: statusColor("pending") }}
          />
          Pending
        </span>
        <span className="inline-flex items-center gap-2">
          <i
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: statusColor("confirmed") }}
          />
          Confirmed
        </span>
        <span className="inline-flex items-center gap-2">
          <i
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: statusColor("cancelled") }}
          />
          Cancelled
        </span>
      </div>

      <Suspense fallback={<div className="text-sm text-zinc-500">Loading calendar…</div>}>
        <FullCalendar
          plugins={[interactionPlugin, dayGridPlugin, timeGridPlugin] as PluginDef[]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="auto"
          aspectRatio={0.95}
          eventDisplay="block"
          eventTextColor="#111"
          eventBorderColor="transparent"
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          expandRows
          nowIndicator
          dayMaxEvents={2}
          moreLinkText={(n) => `+${n} more`}
          handleWindowResize
          slotEventOverlap={false}
          events={events as EventInput[]}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          dayCellContent={(arg) => ({
            html: `<div class="text-[11px] sm:text-[12px] font-medium">${arg.dayNumberText}</div>`,
          })}
        />
      </Suspense>

      {loading && <div className="mt-3 text-sm text-zinc-500">Refreshing…</div>}
      {!loading && !error && events.length === 0 && (
        <div className="mt-3 text-sm text-zinc-500">No bookings in this range.</div>
      )}
      {error && <div className="mt-3 text-sm text-red-600">Failed to load: {error}</div>}
    </div>
  );
}
