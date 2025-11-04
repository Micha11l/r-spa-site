"use client";

import * as React from "react";
import { Suspense } from "react";

// ✅ 主入口
export default function PayBookingLayout({ params, searchParams }: any) {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <PayBooking bookingId={params.booking_id} search={searchParams} />
    </Suspense>
  );
}

// ✅ 通用 fetch
async function getBooking(bookingId: string) {
  const base =
    typeof window !== "undefined"
      ? ""
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const r = await fetch(`${base}/api/bookings/brief?id=${bookingId}`, {
    cache: "no-store",
  });
  if (!r.ok) {
    console.error("[getBooking] failed", r.status);
    return null;
  }
  return await r.json();
}

// ✅ 小工具
function toast(msg: string) {
  if (typeof window !== "undefined") alert(msg);
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format((cents || 0) / 100);
}

async function createDeposit(bookingId: string) {
  const r = await fetch("/api/payments/deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ booking_id: bookingId }),
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j?.error || "Failed to create checkout");
  }
  const j = await r.json();
  return j.url as string;
}

// ✅ 主组件
function PayBooking({
  bookingId,
  search,
}: {
  bookingId: string;
  search: Record<string, string>;
}) {
  const [bk, setBk] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    getBooking(bookingId).then(setBk);
  }, [bookingId]);

  React.useEffect(() => {
    if (search?.success)
      toast("✅ Payment succeeded. Your booking is now confirmed.");
    if (search?.canceled) toast("⚠️ Payment canceled.");
  }, [search]);

  if (!bk)
    return (
      <div className="mx-auto max-w-2xl p-6 text-zinc-600">Loading booking…</div>
    );

  // ✅ 状态显示逻辑
  if (bk.status === "cancelled") {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-800">
          Booking Cancelled ❌
        </h1>
        <p className="text-zinc-600">This booking has been cancelled.</p>
      </div>
    );
  }

  if (bk.status === "confirmed") {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center space-y-2">
        <h1 className="text-2xl font-semibold text-green-600">
          Payment Confirmed ✅
        </h1>
        <p>Your booking is now confirmed.</p>
        <div className="mt-4 rounded-xl border bg-white p-4 space-y-2 text-left">
          <div>
            <span className="font-medium">Service:</span> {bk.service_name}
          </div>
          <div>
            <span className="font-medium">Name:</span> {bk.customer_name}
          </div>
          <div>
            <span className="font-medium">Time:</span> {bk.start_ts_fmt}
          </div>
          <div>
            <span className="font-medium">Deposit Paid:</span>{" "}
            {formatMoney(bk.deposit_cents)}
          </div>
        </div>
      </div>
    );
  }

  // ✅ 主要付款卡片
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
          <span className="font-medium">Time:</span> {bk.start_ts_fmt}
        </div>
        <div>
          <span className="font-medium">Deposit:</span>{" "}
          {formatMoney(
            bk.deposit_cents ||
              Math.round((bk.price_cents || 10000) * 0.5)
          )}
        </div>

        <p className="text-sm text-zinc-600 pt-2">
          Free cancel within 48h before the appointment. Within 24h, deposit is
          non-refundable.
        </p>

        <button
          disabled={busy}
          onClick={async () => {
            try {
              setBusy(true);
              const url = await createDeposit(bookingId);
              window.location.href = url;
            } catch (e: any) {
              toast(e.message);
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
