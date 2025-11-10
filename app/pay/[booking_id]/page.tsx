"use client";

import * as React from "react";
import { useToast } from "@/components/Toast";

// ------- utils -------
async function getBooking(bookingId: string) {
  const base =
    typeof window !== "undefined"
      ? ""
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const r = await fetch(`${base}/api/bookings/brief?id=${bookingId}`, { cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    (cents || 0) / 100
  );
}

function truthy(v: any) {
  return v === true || v === "true" || v === "1" || v === 1;
}

function removeParamsFromURL(params: string[]) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  params.forEach((p) => url.searchParams.delete(p));
  window.history.replaceState({}, "", url.toString());
}

async function createDeposit(bookingId: string) {
  const r = await fetch("/api/payments/deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ booking_id: bookingId }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || "Failed to create checkout");
  if (j.alreadyPaid) return null;
  return j.url as string;
}

async function confirmBySession(sessionId: string) {
  const r = await fetch("/api/payments/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  return r.json().catch(() => ({}));
}

// ------- page component -------
export default function PayBookingPage({
  params,
  searchParams,
}: {
  params: { booking_id: string };
  searchParams: Record<string, string>;
}) {
  const bookingId = params.booking_id;
  const [bk, setBk] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);
  const t = useToast();

  // guards
  const didNotifyRef = React.useRef(false);
  const didConfirmRef = React.useRef(false);
  const didPollRef = React.useRef(false);

  const paid = truthy(searchParams?.success) || truthy(searchParams?.paid);
  const canceled = truthy(searchParams?.canceled);

  const sessionId =
    searchParams?.session_id ||
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("session_id") || ""
      : "");

  // 初始加载
  React.useEffect(() => {
    getBooking(bookingId).then(setBk);
  }, [bookingId]);

  // 支付结果单次通知
  React.useEffect(() => {
    if (didNotifyRef.current) return;

    if (paid) {
      didNotifyRef.current = true;
      t.success("Payment succeeded. Your booking is now being confirmed…");
    } else if (canceled) {
      didNotifyRef.current = true;
      t.warn("Payment canceled.");
      removeParamsFromURL(["canceled"]);
    }
  }, [paid, canceled]);

  // 成功回跳：先后端确认一次（使用 session_id），然后轮询直到 confirmed
  React.useEffect(() => {
    if (!paid || !sessionId || didConfirmRef.current) return;
    didConfirmRef.current = true;

    (async () => {
      try {
        await confirmBySession(sessionId);
      } catch (e) {
        // 即使 confirm 接口出错，也继续轮询，Webhook 可能会把它修正
        console.warn("[confirm] failed, will still poll");
      }

      if (didPollRef.current) return;
      didPollRef.current = true;

      const start = Date.now();
      const deadline = start + 20_000; // 最多等 20s

      while (Date.now() < deadline) {
        const fresh = await getBooking(bookingId);
        if (fresh) setBk(fresh);
        if (fresh?.status === "confirmed") {
          t.success("Booking confirmed 🎉");
          // 清掉 success & session_id，避免刷新再弹
          removeParamsFromURL(["success", "session_id"]);
          return;
        }
        await new Promise((res) => setTimeout(res, 1200));
      }

      // 超时也清参数，避免刷新反复提示
      removeParamsFromURL(["success", "session_id"]);
    })();
  }, [paid, sessionId, bookingId]);

  // ------- render -------
  if (!bk) {
    return <div className="mx-auto max-w-2xl p-6 text-zinc-600">Loading booking…</div>;
  }

  if (bk.status === "cancelled") {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-800">Booking Cancelled ❌</h1>
        <p className="text-zinc-600">This booking has been cancelled.</p>
      </div>
    );
  }

  if (bk.status === "confirmed") {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center space-y-2">
        <h1 className="text-2xl font-semibold text-green-600">Payment Confirmed ✅</h1>
        <p>Your booking is now confirmed.</p>
        <div className="mt-4 rounded-xl border bg-white p-4 space-y-2 text-left">
          <div>
            <span className="font-medium">Service:</span> {bk.service_name}
          </div>
          <div>
            <span className="font-medium">Name:</span> {bk.customer_name}
          </div>
          <div>
            <span className="font-medium">Time:</span> {bk.start_at_fmt}
          </div>
          <div>
            <span className="font-medium">Deposit Paid:</span> {formatMoney(bk.deposit_cents)}
          </div>
        </div>
      </div>
    );
  }

  // 待支付
  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Pay deposit</h1>

      <div className="rounded-xl border bg-white p-4 space-y-2">
        <div>
          <span className="font-medium">Service:</span> {bk.service_name}
        </div>
        <div>
          <span className="font-medium">Name:</span> {bk.customer_name}
        </div>
        <div>
          <span className="font-medium">Time:</span> {bk.start_at_fmt}
        </div>
        <div>
          <span className="font-medium">Deposit:</span>{" "}
          {formatMoney(bk.deposit_cents || Math.round((bk.price_cents || 10000) * 0.5))}
        </div>

        <p className="text-sm text-zinc-600 pt-2">
          Free cancel within 48h before the appointment. Within 24h, deposit is non-refundable.
        </p>

        <button
          disabled={busy}
          onClick={async () => {
            try {
              setBusy(true);
              const url = await createDeposit(bookingId);
              if (!url) {
                const fresh = await getBooking(bookingId);
                if (fresh) setBk(fresh);
                return;
              }
              window.location.href = url;
            } catch (e: any) {
              t.error(e.message || "Failed to start checkout");
            } finally {
              setBusy(false);
            }
          }}
          className="w-full mt-3 rounded-lg bg-black text-white py-2 font-medium hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? "Redirecting…" : "Pay 50% deposit"}
        </button>
      </div>
    </div>
  );
}