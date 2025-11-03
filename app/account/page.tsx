"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Profile = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  dob?: string | null;
  street?: string;
  city?: string;
  postal?: string;
  country?: string;
  marketing_email?: boolean;
};

type Booking = {
  id: string;
  service_name: string;
  start_at: string;
  end_at: string;
  status?: "pending" | "confirmed" | "cancelled";
  notes?: string | null;
};

type SlotInfo = {
  start: string;
  end: string;
  count: number;
  capacity: number;
};

const CAPACITY = 5;

export default function AccountPage() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // ====== 小班课 ======
  const [clsType, setClsType] = useState<"stretching" | "yoga" | "pilates">("stretching");
  const [clsDate, setClsDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [clsMsg, setClsMsg] = useState<string | null>(null);
  const [mySlots, setMySlots] = useState<string[]>([]);
  const [busySlots, setBusySlots] = useState<Set<string>>(new Set());

  // 当前用户
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (u?.email) setEmail(u.email);
    })();
  }, [supabase]);

  // 读取 profile
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("first_name,last_name,phone,dob,street,city,postal,country,marketing_email")
        .eq("id", u.user.id)
        .maybeSingle();
      if (data) setProfile(data as Profile);
    })();
  }, [supabase]);

  // 获取预约
  useEffect(() => {
    if (!email) return;
    (async () => {
      setLoadingBookings(true);
      try {
        const res = await fetch(`/api/account/bookings?email=${encodeURIComponent(email)}`, {
          cache: "no-store",
        });
        const j = await res.json();
        setUpcoming(j.upcoming || []);
        setPast(j.past || []);
      } finally {
        setLoadingBookings(false);
      }
    })();
  }, [email]);

  // 保存资料
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) throw new Error("No session");
      const res = await fetch("/api/profile/upsert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session.access_token}`,
        },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to save");
      }
      setSaveMsg("Saved!");
      localStorage.setItem(
        "booking_preset",
        JSON.stringify({
          name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
          email,
          phone: profile.phone ?? "",
        })
      );
    } catch (e: any) {
      setSaveMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 2500);
    }
  }

  // ====== 小班课部分 ======
  const slotTemplate = useMemo(
    () => [
      { start: "06:30", end: "07:30" },
      { start: "07:30", end: "08:30" },
      { start: "08:30", end: "09:30" },
      { start: "17:30", end: "18:30" },
      { start: "18:30", end: "19:30" },
      { start: "19:30", end: "20:30" },
    ],
    []
  );

  async function loadSlots() {
    setLoadingSlots(true);
    setClsMsg(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = new URL("/api/classes/slots", window.location.origin);
      url.searchParams.set("date", clsDate);
      url.searchParams.set("type", clsType);
      const res = await fetch(url.toString(), {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const j = await res.json();
      const counts = j.counts || {};
      setMySlots(j.mine || []);
      setSlots(
        slotTemplate.map((t) => ({
          ...t,
          count: counts[`${t.start}-${t.end}`] || 0,
          capacity: CAPACITY,
        }))
      );
    } catch (e: any) {
      setClsMsg(e?.message || "Load failed");
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    loadSlots();
  }, [clsDate, clsType]);

  async function signUpForSlot(s: SlotInfo) {
    const key = `${s.start}-${s.end}`;
    setBusySlots((prev) => new Set([...prev, key]));
    setClsMsg(null);

    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) throw new Error("Not signed in");

      const res = await fetch("/api/classes/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session.access_token}`,
        },
        body: JSON.stringify({
          class_type: clsType,
          date: clsDate,
          start: s.start,
          end: s.end,
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Signup failed");
      setClsMsg(j?.message || "Updated!");
      await loadSlots();
    } catch (e: any) {
      setClsMsg(e?.message || "Signup failed");
    } finally {
      setBusySlots((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setTimeout(() => setClsMsg(null), 2000);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My account</h1>
          {email && <p className="mt-1 text-zinc-600">Signed in as {email}</p>}
        </div>
        <button onClick={signOut} className="btn btn-ghost">
          Sign out
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <section className="rounded-xl border bg-white p-4 md:p-6">
          <h2 className="text-xl font-semibold">Faster checkout</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Save your contact info. When you book, we’ll prefill your details.
          </p>

          <form onSubmit={saveProfile} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["First name", "first_name"],
              ["Last name", "last_name"],
              ["Phone", "phone"],
              ["Street", "street"],
              ["City", "city"],
              ["ZIP / Postal code", "postal"],
              ["Country", "country"],
            ].map(([label, key]) => (
              <div key={key} className={key === "street" ? "md:col-span-2" : ""}>
                <label className="block text-sm mb-1">{label}</label>
                <input
                  value={(profile as any)[key] ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
            ))}

            <div className="md:col-span-2 flex items-center justify-between">
              <span className="text-sm text-zinc-600">
                We’ll also prefill your info during booking.
              </span>
              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
            {saveMsg && <div className="md:col-span-2 text-sm text-zinc-700">{saveMsg}</div>}
          </form>
        </section>

        {/* Bookings */}
        <section className="rounded-xl border bg-white p-4 md:p-6">
          <h2 className="text-xl font-semibold">Track appointments</h2>
          <p className="mt-1 text-sm text-zinc-600">
            View upcoming and past appointments.
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Upcoming</h3>
              {loadingBookings ? (
                <p className="mt-2 text-sm text-zinc-500">Loading…</p>
              ) : upcoming.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">No upcoming appointments.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {upcoming.map((b) => (
                    <li key={b.id} className="rounded border p-3 text-sm">
                      <div className="font-medium">{b.service_name}</div>
                      <div className="text-zinc-600">
                        {dayjs(b.start_at).format("MMM D, YYYY h:mm A")} –{" "}
                        {dayjs(b.end_at).format("h:mm A")}
                      </div>
                      {b.status && (
                        <div className="text-zinc-500 mt-1">Status: {b.status}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="font-medium">Past</h3>
              {loadingBookings ? (
                <p className="mt-2 text-sm text-zinc-500">Loading…</p>
              ) : past.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">No past appointments.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {past.map((b) => (
                    <li key={b.id} className="rounded border p-3 text-sm">
                      <div className="font-medium">{b.service_name}</div>
                      <div className="text-zinc-600">
                        {dayjs(b.start_at).format("MMM D, YYYY h:mm A")} –{" "}
                        {dayjs(b.end_at).format("h:mm A")}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-4">
            <a href="/booking" className="btn btn-ghost">
              Book another session
            </a>
          </div>
        </section>

        {/* Small-group classes */}
        <section className="rounded-xl border bg-white p-4 md:p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold">Small-group classes</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Stretching / Yoga / Pilates. Up to 5 people per class. A class runs once 5 sign-ups are reached.
          </p>

          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <select
              className="border rounded px-2 py-1"
              value={clsType}
              onChange={(e) => setClsType(e.target.value as any)}
            >
              <option value="stretching">Stretching</option>
              <option value="yoga">Yoga</option>
              <option value="pilates">Pilates</option>
            </select>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={clsDate}
              onChange={(e) => setClsDate(e.target.value)}
            />
            <button className="btn btn-ghost" onClick={loadSlots} disabled={loadingSlots}>
              {loadingSlots ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {slots.map((s) => {
              const key = `${s.start}-${s.end}`;
              const isBusy = busySlots.has(key);
              const left = Math.max(0, s.capacity - s.count);
              const full = left === 0;
              const isMine = mySlots.includes(key);
              const ready = s.count >= s.capacity;

              return (
                <div key={key} className="rounded border p-3">
                  <div className="font-medium">
                    {s.start}–{s.end}
                  </div>
                  <div className="text-sm text-zinc-600 mt-1">
                    {s.count}/{s.capacity} signed up{" "}
                    {ready && <span className="text-green-600">• Ready to run</span>}
                  </div>
                  <button
                    className={`btn w-full mt-2 transition-all ${
                      isMine
                        ? isBusy
                          ? "btn-outline opacity-70 cursor-wait"
                          : "btn-outline"
                        : full
                        ? "btn-disabled"
                        : isBusy
                        ? "btn-primary opacity-70 cursor-wait"
                        : "btn-primary"
                    }`}
                    disabled={isBusy || (full && !isMine)}
                    onClick={() => signUpForSlot(s)}
                  >
                    {isBusy
                      ? isMine
                        ? "Withdrawing..."
                        : "Joining..."
                      : isMine
                      ? "Withdraw"
                      : full
                      ? "Full"
                      : "Sign up"}
                  </button>
                </div>
              );
            })}
          </div>

          {clsMsg && <div className="mt-3 text-sm text-zinc-700">{clsMsg}</div>}
        </section>
      </div>
    </div>
  );
}
