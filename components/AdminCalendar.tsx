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

// ---- FullCalendar 类型（关键：给 dynamic 指定 props 泛型，修复 TS 报错）----
import type {
  CalendarOptions,
  EventInput,
  PluginDef,
  DatesSetArg,
  EventClickArg,
} from "@fullcalendar/core";

// 插件常规 import（不要 dynamic）
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";

// React 组件用 dynamic，引入 default 并禁用 SSR
const FullCalendar = dynamic<CalendarOptions>(
  () => import("@fullcalendar/react").then((m) => m.default),
  { ssr: false }
);

dayjs.extend(utc);
dayjs.extend(tz);

const TZ = process.env.NEXT_PUBLIC_TZ || "America/Toronto";

// ---- 数据类型 ----
type Booking = {
  id?: string;
  service_name: string;
  start_ts: string; // ISO
  end_ts: string; // ISO
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
  status?: "pending" | "confirmed" | "cancelled";
};

// ---- 小工具 ----
function statusColor(s?: Booking["status"]) {
  switch (s) {
    case "confirmed":
      return "#16a34a"; // green
    case "cancelled":
      return "#ef4444"; // red
    default:
      return "#f59e0b"; // amber (pending)
  }
}

function toTZ(iso: string) {
  // 统一做时区归一化，避免 Invalid Date
  return dayjs(iso).tz(TZ).toISOString();
}

export default function AdminCalendar() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 记录当前“可视范围”，供轮询和聚焦刷新使用
  const rangeRef = useRef<{ fromISO: string; toISO: string } | null>(null);

  // 转换为 FullCalendar 事件
  const events: EventInput[] = useMemo(
    () =>
      items.map((b) => ({
        id: b.id || `${b.customer_email ?? b.customer_phone}-${b.start_ts}`,
        title: `${b.service_name} · ${b.customer_name}`,
        start: toTZ(b.start_ts || (b as any).start),
        end: toTZ(b.end_ts || (b as any).end),
        backgroundColor: statusColor(b.status),
        borderColor: statusColor(b.status),
        extendedProps: {
          status: b.status,
          phone: b.customer_phone,
          email: b.customer_email,
          notes: b.notes,
        },
      })),
    [items]
  );

  // 拉取指定范围
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
      console.log("Fetched bookings:", j);
      setItems(Array.isArray(j) ? j : Array.isArray(j.items) ? j.items : []);
    } catch (e: any) {
      console.error("[admin calendar] load error", e);
      setItems([]);
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  // 首次加载：取“本月”范围
  useEffect(() => {
    const fromISO = dayjs().startOf("month").tz(TZ).toISOString();
    const toISO = dayjs().endOf("month").tz(TZ).toISOString();
    rangeRef.current = { fromISO, toISO };
    fetchRange(fromISO, toISO);
  }, [fetchRange]);

  // 视图切换/日期跳转时，更新范围并请求
  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const fromISO = dayjs(arg.start).tz(TZ).toISOString();
      const toISO = dayjs(arg.end).tz(TZ).toISOString();
      rangeRef.current = { fromISO, toISO };
      fetchRange(fromISO, toISO);
    },
    [fetchRange]
  );

  // 每 60s 自动刷新
  useEffect(() => {
    const id = setInterval(() => {
      if (rangeRef.current) {
        const { fromISO, toISO } = rangeRef.current;
        fetchRange(fromISO, toISO);
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [fetchRange]);

  // 窗口获得焦点时刷新
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

  // 点击事件：格式化展示，避免 undefined / Invalid Date
  const handleEventClick = useCallback((info: EventClickArg) => {
    const ev = info.event;
    const start = ev.start
      ? dayjs(ev.start).tz(TZ).format("MMM D, h:mm A")
      : "";
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

      <Suspense
        fallback={
          <div className="text-sm text-zinc-500">Loading calendar…</div>
        }
      >
        <FullCalendar
          plugins={
            [interactionPlugin, dayGridPlugin, timeGridPlugin] as PluginDef[]
          }
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="auto"
          events={events as EventInput[]}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: true,
          }}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
        />
      </Suspense>

      {loading && <div className="mt-3 text-sm text-zinc-500">Refreshing…</div>}
      {!loading && !error && events.length === 0 && (
        <div className="mt-3 text-sm text-zinc-500">
          No bookings in this range.
        </div>
      )}
      {error && (
        <div className="mt-3 text-sm text-red-600">Failed to load: {error}</div>
      )}
    </div>
  );
}