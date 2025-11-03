"use client";

import * as React from "react";
import { Suspense } from "react";

export default function PayBookingLayout({ params, searchParams }: any) {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <PayBooking bookingId={params.booking_id} search={searchParams} />
    </Suspense>
  );
}

async function getBooking(bookingId: string) {
  // const r = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/bookings/brief?id=${bookingId}`, { cache: "no-store" });
  // return r.ok ? r.json() : null;
  const base =
    typeof window !== "undefined"
    ? "" //browser >相对路径
    : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
  const r = await fetch(`${base}/api/bookings/brief?id=${bookingId}`, {cache: "no-store"});
  if (!r.ok) {
    console.error("[getBooking] failed", r.status);
    return null;
  }
  return await r.json();
}

function toast(msg: string) {
  if (typeof window !== "undefined") alert(msg);
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format((cents || 0) / 100);
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

function PayBooking({ bookingId, search }: { bookingId: string; search: Record<string, string> }) {
  const [bk, setBk] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    getBooking(bookingId).then(setBk);
  }, [bookingId]);

  React.useEffect(() => {
    if (search?.success) toast("Payment succeeded. Your booking is now confirmed.");
    if (search?.canceled) toast("Payment canceled.");
  }, [search]);

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Pay deposit</h1>
      {!bk ? (
        <p className="text-zinc-600">Loading booking…</p>
      ) : (
        <div className="rounded-xl border bg-white p-4 space-y-2">
          <div><span className="font-medium">Service:</span> {bk.service_name}</div>
          <div><span className="font-medium">Name:</span> {bk.customer_name}</div>
          <div><span className="font-medium">Time:</span> {bk.start_ts_fmt}</div>
          <div><span className="font-medium">Deposit:</span> {formatMoney(bk.deposit_cents || Math.round((bk.price_cents || 10000) * 0.5))}</div>

          <p className="text-sm text-zinc-600 pt-2">
            Free cancel within 48h before the appointment. Within 24h, deposit is non-refundable.
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
            className="btn btn-primary mt-2"
          >
            {busy ? "Redirecting…" : "Pay 50% deposit"}
          </button>
        </div>
      )}
    </div>
  );
}
