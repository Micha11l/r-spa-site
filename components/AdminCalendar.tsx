"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

// 只对 React 包装组件做动态加载（禁用 SSR），插件常规 import
const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";

import type { EventInput } from "@fullcalendar/core";

dayjs.extend(utc);
dayjs.extend(tz);

const TZ = process.env.NEXT_PUBLIC_TZ || "America/Toronto";

type Booking = {
  id?: string;
  service: string;
  name: string;
  email?: string;
  phone?: string;
  start: string; // ISO
  end: string;   // ISO
  status?: "pending" | "confirmed" | "cancelled";
};

function statusColor(s?: Booking["status"]) {
  switch (s) {
    case "confirmed": return "#16a34a"; // green
    case "cancelled": return "#ef4444"; // red
    default: return "#f59e0b";          // amber (pending)
  }
}

export default function AdminCalendar() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const events: EventInput[] = useMemo(
    () =>
      items.map((b) => ({
        id: b.id || `${b.email}-${b.start}`,
        title: `${b.service} · ${b.name}`,
        start: dayjs(b.start).tz(TZ).toISOString(),
        end: dayjs(b.end).tz(TZ).toISOString(),
        backgroundColor: statusColor(b.status),
        borderColor: statusColor(b.status),
      })),
    [items]
  );

  const load = useCallback(async (fromISO: string, toISO: string) => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/bookings", window.location.origin);
      url.searchParams.set("from", fromISO);
      url.searchParams.set("to", toISO);
      const res = await fetch(url.toString(), { cache: "no-store" });
      // 兜底：就算 404/非 JSON 也不致命
      const j = res.ok ? await res.json().catch(() => ({})) : {};
      setItems(Array.isArray(j.items) ? j.items : []);
    } catch (e) {
      console.error("[admin calendar] load error", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
    // 初次加载当前月范围
    const start = dayjs().startOf("month").tz(TZ).toISOString();
    const end = dayjs().endOf("month").tz(TZ).toISOString();
    load(start, end);
    }, 60_000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="rounded-xl border bg-white p-3 md:p-4">
      <Suspense fallback={<div className="text-sm text-zinc-500">Loading calendar…</div>}>
        <FullCalendar
          plugins={[interactionPlugin, dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
          height="auto"
          events={events}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: true }}
          datesSet={(arg) => {
            const fromISO = dayjs(arg.start).tz(TZ).toISOString();
            const toISO = dayjs(arg.end).tz(TZ).toISOString();
            load(fromISO, toISO);
          }}
          eventClick={(info) => {
            const ev = info.event;
            alert(`${ev.title}\n${dayjs(ev.start!).format("MMM D, h:mm A")} - ${dayjs(ev.end!).format("h:mm A")}`);
          }}
        />
      </Suspense>
      {loading && <div className="mt-3 text-sm text-zinc-500">Loading…</div>}
    </div>
  );
}