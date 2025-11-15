// app/account/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import WalletCard from '@/components/account/WalletCard';

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

export default function AccountPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  // ====== Small-group classes ======
  const [clsType, setClsType] = useState<"stretching" | "yoga" | "pilates">("stretching");
  const [clsDate, setClsDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [clsMsg, setClsMsg] = useState<string | null>(null);
  const [mySlots, setMySlots] = useState<string[]>([]);
  const [busySlots, setBusySlots] = useState<Set<string>>(new Set());

  // Advanced: Check if it's winter (November to March)
  const isWinter = useMemo(() => {
    const month = dayjs().month(); // 0-11
    return month >= 10 || month <= 2; // Nov (10) to Mar (2)
  }, []);

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

  // ====== Small-group classes part ======
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
      const capacities = j.capacities || {}; // Added: Get capacity from API
      setMySlots(j.mine || []);
     
      // Use dynamic capacity
      setSlots(
        slotTemplate.map((t) => {
          const key = `${t.start}-${t.end}`;
          return {
            ...t,
            count: counts[key] || 0,
            capacity: capacities[key] || 5, // Use API-returned capacity, default 5
          };
        })
      );
    } catch (e: any) {
      toast.error(e?.message || "Failed to load class slots");
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    loadSlots();
  }, [clsDate, clsType]);

  async function signUpForSlot(s: SlotInfo) {
    const key = `${s.start}-${s.end}`;
    const isMine = mySlots.includes(key);
    if (isWinter && !isMine) {
      toast.error("Classes are suspended during winter. You can withdraw from existing sign-ups if needed.");
      return;
    }
    setBusySlots((prev) => new Set([...prev, key]));
    setClsMsg(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        toast.error("Please sign in to join classes");
        throw new Error("Not signed in");
      }
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
     
      if (!res.ok) {
        // Handle different error cases
        const errorMsg = j?.error || "Signup failed";
       
        // Added: Handle cross-type conflict
        if (errorMsg === "already_signed_other" && j.other_type) {
          toast.error(`You've already signed into ${j.other_type}`);
        } else if (errorMsg.includes("duplicate") || errorMsg.includes("already")) {
          toast.error("You've already signed up for this class");
        } else if (errorMsg === "class_full" || errorMsg.includes("full") || errorMsg.includes("capacity")) {
          toast.error("This class is full");
        } else {
          toast.error(errorMsg);
        }
        throw new Error(errorMsg);
      }
     
      // Success prompt
      if (j?.message === "Withdrawn") {
        toast.success("Successfully withdrawn from class");
      } else {
        toast.success("Successfully signed up for class!");
      }
     
      await loadSlots();
    } catch (e: any) {
      // Errors are already handled above, no need to display again
      console.error("Signup error:", e);
    } finally {
      setBusySlots((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
         {/* ⭐ 新添加 - Wallet Section */}
         <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-light text-slate-900">
              Wallet
            </h2>
            <a
              href="/giftcard/purchase"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              🎁 Buy Gift Card
            </a>
          </div>
          <WalletCard />
        </section>
      
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
        <section className="rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Faster checkout</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Save your contact info. When you book, we&apos;ll prefill your details.
          </p>
          <form onSubmit={saveProfile} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium mb-2">{label}</label>
                <input
                  value={(profile as any)[key] ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
            <div className="md:col-span-2 flex items-center justify-between pt-4">
              <span className="text-sm text-zinc-600">
                We&apos;ll also prefill your info during booking.
              </span>
              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
            {saveMsg && (
              <div className={`md:col-span-2 text-sm ${saveMsg === "Saved!" ? "text-green-600" : "text-red-600"}`}>
                {saveMsg}
              </div>
            )}
          </form>
        </section>
  
        {/* Bookings */}
        <section className="rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Track appointments</h2>
          <p className="mt-2 text-sm text-zinc-600">
            View upcoming and past appointments.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-lg mb-3">Upcoming</h3>
              {loadingBookings ? (
                <p className="text-sm text-zinc-500">Loading…</p>
              ) : upcoming.length === 0 ? (
                <p className="text-sm text-zinc-500">No upcoming appointments.</p>
              ) : (
                <ul className="space-y-3">
                  {upcoming.map((b) => (
                    <li key={b.id} className="rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                      <div className="font-medium">{b.service_name}</div>
                      <div className="text-zinc-600 text-sm mt-1">
                        {dayjs(b.start_at).format("MMM D, YYYY h:mm A")} –{" "}
                        {dayjs(b.end_at).format("h:mm A")}
                      </div>
                      {b.status && (
                        <div className="text-zinc-500 text-sm mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            b.status === "confirmed" 
                              ? "bg-green-100 text-green-800"
                              : b.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="font-medium text-lg mb-3">Past</h3>
              {loadingBookings ? (
                <p className="text-sm text-zinc-500">Loading…</p>
              ) : past.length === 0 ? (
                <p className="text-sm text-zinc-500">No past appointments.</p>
              ) : (
                <ul className="space-y-3">
                  {past.map((b) => (
                    <li key={b.id} className="rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                      <div className="font-medium">{b.service_name}</div>
                      <div className="text-zinc-600 text-sm mt-1">
                        {dayjs(b.start_at).format("MMM D, YYYY h:mm A")} –{" "}
                        {dayjs(b.end_at).format("h:mm A")}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="mt-6">
            <a href="/booking" className="btn btn-primary">
              Book another session
            </a>
          </div>
        </section>
  
        {/* Small-group classes */}
        <section className="rounded-xl border bg-white p-6 lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Small-group classes</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Stretching / Yoga / Pilates. Up to 5 people per class. A class runs once 5 sign-ups are reached.
            </p>
          </div>
  
          {/* Seasonal Reminder with Animation */}
          {isWinter && (
            <div className="rounded-xl border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50 p-6 text-yellow-800 shadow-lg animate-pulse">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <svg 
                    className="w-6 h-6 text-yellow-600 animate-bounce" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M12 3V21M4 12H20M6.34315 6.34315L17.6569 17.6569M6.34315 17.6569L17.6569 6.34315M3 12L5 10M3 12L5 14M21 12L19 10M21 12L19 14M12 3L10 5M12 3L14 5M12 21L10 19M12 21L14 19"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                    Seasonal Reminder
                  </h3>
                  <p className="text-yellow-700 text-sm leading-relaxed">
                    Due to the winter season, small-group classes (Stretching / Yoga / Pilates) are temporarily suspended. 
                    We will resume services in suitable seasons, stay tuned! In the meantime, we recommend trying our individual appointment services.
                  </p>
                </div>
              </div>
            </div>
          )}
  
          {/* Class Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={clsType}
              onChange={(e) => setClsType(e.target.value as any)}
            >
              <option value="stretching">Stretching</option>
              <option value="yoga">Yoga</option>
              <option value="pilates">Pilates</option>
            </select>
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={clsDate}
              onChange={(e) => setClsDate(e.target.value)}
            />
            <button 
              className="btn btn-ghost border border-gray-300 hover:bg-gray-50" 
              onClick={loadSlots} 
              disabled={loadingSlots}
            >
              {loadingSlots ? "Refreshing…" : "Refresh"}
            </button>
          </div>
  
          {/* Time Slots Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {slots.map((s) => {
              const key = `${s.start}-${s.end}`;
              const isBusy = busySlots.has(key);
              const left = Math.max(0, s.capacity - s.count);
              const full = left === 0;
              const isMine = mySlots.includes(key);
              const ready = s.count >= s.capacity;
              
              return (
                <div key={key} className="rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                  <div className="font-medium text-gray-900">
                    {s.start}–{s.end}
                  </div>
                  <div className="text-sm text-zinc-600 mt-2">
                    {s.count}/{s.capacity} signed up{" "}
                    {ready && (
                      <span className="text-green-600 font-medium">• Ready to run</span>
                    )}
                  </div>
                  <button
                    className={`btn w-full mt-3 transition-all ${
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
          
          {clsMsg && (
            <div className="text-sm text-zinc-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
              {clsMsg}
            </div>
          )}
        </section>
      </div>
    </div>
  </div>
    </div>
  );
}