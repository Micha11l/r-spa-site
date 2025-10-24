// app/account/page.tsx
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
  start: string; // "06:30"
  end: string;   // "07:30"
  count: number;
  capacity: number;
};

const CAPACITY = 5;

export default function AccountPage() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState<string>("");
  const [profile, setProfile] = useState<Profile>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // ----- Classes -----
  const [clsType, setClsType] = useState<"stretching" | "yoga" | "pilates">("stretching");
  const [clsDate, setClsDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [clsBusy, setClsBusy] = useState(false);
  const [clsMsg, setClsMsg] = useState<string | null>(null);

  // 当前用户
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (u?.email) setEmail(u.email);
    })();
  }, [supabase]);

  // 读取 profile（RLS: 仅本人可读）
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("profiles")
        .select(
          "first_name,last_name,phone,dob,street,city,postal,country,marketing_email"
        )
        .eq("id", u.user.id)
        .maybeSingle();
      if (data) setProfile(data as Profile);
    })();
  }, [supabase]);

  // 读取我的预约：用服务端 API 按 email 聚合（避免暴露表结构）
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

  // 保存资料（profiles）
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
      // 同时把“快速结账”的三项资料放到本地，供 /booking 预填
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

  // ====== 小班课：列出当日各时段人数 ======
  const slotTemplate: { start: string; end: string }[] = useMemo(
    () => [
      // Morning
      { start: "06:30", end: "07:30" },
      { start: "07:30", end: "08:30" },
      { start: "08:30", end: "09:30" },
      // Evening
      { start: "17:30", end: "18:30" },
      { start: "18:30", end: "19:30" },
      { start: "19:30", end: "20:30" },
    ],
    []
  );

  async function loadSlots() {
    setClsBusy(true);
    setClsMsg(null);
    try {
      const url = new URL("/api/classes/slots", window.location.origin);
      url.searchParams.set("date", clsDate);
      url.searchParams.set("type", clsType);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const j = await res.json();
      const counts: Record<string, number> = j.counts || {};
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
      setClsBusy(false);
    }
  }

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clsDate, clsType]);

  // 报名
  async function signUpForSlot(s: SlotInfo) {
    setClsBusy(true);
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
      setClsMsg(j?.message || "Signed up!");
      await loadSlots();
    } catch (e: any) {
      setClsMsg(e?.message || "Signup failed");
    } finally {
      setClsBusy(false);
      setTimeout(() => setClsMsg(null), 2500);
    }
  }

  // 退出
  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My account</h1>
          {email && <p className="mt-1 text-zinc-600">Signed in as {email}</p>}
        </div>
        <button onClick={signOut} className="btn btn-ghost">Sign out</button>
      </header>

      {/* 网格四卡 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faster checkout / Profile */}
        <section className="rounded-xl border bg-white p-4 md:p-6">
          <h2 className="text-xl font-semibold">Faster checkout</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Save your contact info. When you book, we’ll prefill your details to make checkout faster.
          </p>

          <form onSubmit={saveProfile} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">First name</label>
              <input
                value={profile.first_name ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Last name</label>
              <input
                value={profile.last_name ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Phone</label>
              <input
                value={profile.phone ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                className="w-full"
              />
            </div>

            {/* 地址（可选） */}
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Street</label>
              <input
                value={profile.street ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, street: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">City</label>
              <input
                value={profile.city ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">ZIP / Postal code</label>
              <input
                value={profile.postal ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, postal: e.target.value }))}
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Country</label>
              <input
                value={profile.country ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                className="w-full"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between">
              <div className="text-sm text-zinc-600">
                We’ll also prefill your name, email and phone on the booking page.
              </div>
              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
            {saveMsg && <div className="md:col-span-2 text-sm text-zinc-700">{saveMsg}</div>}
          </form>
        </section>

        {/* My bookings */}
        <section className="rounded-xl border bg-white p-4 md:p-6">
          <h2 className="text-xl font-semibold">Track appointments</h2>
          <p className="mt-1 text-sm text-zinc-600">View upcoming and past appointments.</p>

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
                      {b.status && <div className="text-zinc-500 mt-1">Status: {b.status}</div>}
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
            <a href="/booking" className="btn btn-ghost">Book another session</a>
          </div>
        </section>

        {/* Classes sign-up */}
        <section className="rounded-xl border bg-white p-4 md:p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold">Small-group classes</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Stretching / Yoga / Pilates. Up to 5 people per class for an intimate group.
            Morning: 6:30–9:30 AM · Evening: 5:30–8:30 PM. A class will run once 5 sign-ups are reached for a time slot.
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
            <button className="btn btn-ghost" onClick={loadSlots} disabled={clsBusy}>
              Refresh
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {slots.map((s) => {
              const left = Math.max(0, s.capacity - s.count);
              const full = left === 0;
              const ready = s.count >= s.capacity; // 满 5 人判定为“达到开班条件”
              return (
                <div key={`${s.start}-${s.end}`} className="rounded border p-3">
                  <div className="font-medium">
                    {s.start}–{s.end}
                  </div>
                  <div className="text-sm text-zinc-600 mt-1">
                    {s.count}/{s.capacity} signed up{" "}
                    {ready ? <span className="text-green-600">• Ready to run</span> : null}
                  </div>
                  <button
                    className="btn btn-primary mt-2 w-full"
                    disabled={clsBusy || full}
                    onClick={() => signUpForSlot(s)}
                  >
                    {full ? "Full" : "Sign up"}
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