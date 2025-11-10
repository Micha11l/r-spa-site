// /app/account/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { motion } from "framer-motion";
import toast from "react-hot-toast";


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
  status?: "scheduled" | "cancelled" | "completed";
};

type ClassType = "stretching" | "yoga" | "pilates";

type SlotsApiResponse = {
  slots?: Array<{
    start_time: string;
    end_time: string;
    signed_count?: number;
    capacity?: number;
    status?: "scheduled" | "cancelled" | "completed";
  }>;
  mine?: Array<string | { start_time: string; end_time?: string | null }>;
  message?: string;
  error?: string;
  detail?: string;
  code?: string | number;
};

type ActionApiResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  detail?: string;
  code?: string | number;
};

type GiftCard = {
  code: string;
  amount: number;
  remaining_amount: number;
  status: string;
  created_at: string;
  sender_name?: string | null;
  recipient_name?: string | null;
  message?: string | null;
};

function mapErr(
  j: ActionApiResponse | any,
  fallback: string,
  status?: number,
  raw?: string
) {
  const codeAny = j?.code ?? j?.error ?? j?.status;
  const code = typeof codeAny === "number" ? String(codeAny) : (codeAny as string | undefined);
  const msg = (j?.detail ?? j?.details ?? j?.message ?? "") as string;
  const text = `${msg} ${raw ?? ""}`.toLowerCase();

  if (j?.error === "time_conflict" || /time_conflict/.test(text)) return "You've already signed up for another class at this time";
  if (j?.error === "class_full") return "This class is full";
  if (j?.error === "class_cancelled") return "This class has been cancelled";
  if (j?.error === "invalid_type") return "Invalid class type";
  if (status === 401 || j?.error === "unauthorized") return "Please sign in first";
  if (j?.error === "already_signed") return "You're already signed up for this slot";
  if (code === "23505" || /unique|duplicate/.test(text)) return "You've already signed up for another class at this time";
  if (status === 409) return msg || "Cannot sign up for this time slot. Please check if you've already signed up for another class";
  return msg || fallback;
}

export default function AccountPage() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [clsType, setClsType] = useState<ClassType>("stretching");
  const [clsDate, setClsDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [myStarts, setMyStarts] = useState<Set<string>>(new Set());
  const [busySlots, setBusySlots] = useState<Set<string>>(new Set());

  type MyDayBooking = { start: string; class_type: ClassType };
  const [myDayBookings, setMyDayBookings] = useState<MyDayBooking[]>([]);

  // Gift Cards
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loadingGiftCards, setLoadingGiftCards] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedCard, setVerifiedCard] = useState<GiftCard | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (u?.email) setEmail(u.email);
    })();
  }, [supabase]);

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

  useEffect(() => {
    if (!email) return;
    loadGiftCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

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
        throw new Error((j as { error?: string })?.error || "Failed to save");
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

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const j: SlotsApiResponse = await res.json();

      let nextSlots: SlotInfo[] = [];
      const mineStarts = new Set<string>();

      if (Array.isArray(j?.slots) && j.slots.length > 0) {
        nextSlots = j.slots.map((r) => ({
          start: (r.start_time || "").slice(0, 5),
          end: (r.end_time || "").slice(0, 5),
          count: Number(r.signed_count ?? 0),
          capacity: Number(r.capacity ?? 5),
          status: r.status ?? "scheduled",
        }));
      }

      if (nextSlots.length < 6) {
        const existingTimes = new Set(nextSlots.map((s) => `${s.start}-${s.end}`));
        slotTemplate.forEach((template) => {
          const templateKey = `${template.start}-${template.end}`;
          if (!existingTimes.has(templateKey)) {
            nextSlots.push({
              start: template.start,
              end: template.end,
              count: 0,
              capacity: 5,
              status: "scheduled",
            });
          }
        });
        nextSlots.sort((a, b) => a.start.localeCompare(b.start));
      }

      if (Array.isArray(j?.mine)) {
        j.mine.forEach((mineItem) => {
          if (typeof mineItem === "string") {
            mineStarts.add(mineItem.slice(0, 5));
          } else if (mineItem?.start_time) {
            mineStarts.add(mineItem.start_time.slice(0, 5));
          }
        });
      }

      setSlots(nextSlots);
      setMyStarts(mineStarts);
    } catch (e: any) {
      toast.error(e?.message || "Load failed");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function loadMyDayBookings() {
    if (!email) return;
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    const { data, error } = await supabase
      .from("class_signups")
      .select("start_time,class_type")
      .eq("email", email)
      .eq("class_date", clsDate.replace(/\//g, "-"))
      .eq("status", "signed");
    if (error) return;
    const list: MyDayBooking[] = (data ?? []).map((r: any) => ({
      start: String(r.start_time || "").slice(0, 5),
      class_type: String(r.class_type || "") as ClassType,
    }));
    setMyDayBookings(list);
  }

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clsDate, clsType]);

  useEffect(() => {
    loadMyDayBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, clsDate]);

  async function signUpForSlot(s: SlotInfo) {
    const key = `${s.start}-${s.end}`;
    const isMine = myDayBookings.some(
      (b) => b.start === s.start && b.class_type === clsType
    );

    if (!isMine) {
      const conflict = myDayBookings.find(
        (b) => b.start === s.start && b.class_type !== clsType
      );
      if (conflict) {
        toast.error(`You've already signed up for ${conflict.class_type} at this time`);
        return;
      }
    }

    setBusySlots((prev) => new Set([...prev, key]));

    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) throw new Error("Not signed in");

      const endpoint = isMine ? "/api/classes/withdraw" : "/api/classes/signup";

      const formatTime = (time: string) => {
        if (time.length === 5) return `${time}:00`;
        if (time.length === 4) return `0${time}:00`;
        return time;
      };

      const startTime = formatTime(s.start);
      const endTime = formatTime(s.end);

      const body = {
        class_type: clsType,
        class_date: clsDate.replace(/\//g, "-"),
        start_time: startTime,
        ...(isMine ? {} : { end_time: endTime }),
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      const responseText = await res.text();
      let j: ActionApiResponse = {};
      try {
        j = responseText ? (JSON.parse(responseText) as ActionApiResponse) : {};
      } catch {}

      if (!res.ok) {
        const friendly = mapErr(
          j,
          isMine ? "Withdraw failed" : "You've already signed up for another class at this time or the class is full",
          res.status,
          responseText
        );
        throw new Error(friendly);
      }

      const successMsg =
        j.message ??
        (isMine ? "Withdrawn successfully" : myStarts.size > 0 ? "Moved to new slot" : "Signed up! 🎉");

      toast.success(successMsg);

      await loadSlots();
      await loadMyDayBookings();
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally {
      setBusySlots((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }
  async function fetchGiftCards() {
    setLoadingGiftCards(true);
    try {
      const res = await fetch(`/api/account/giftcards?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        console.error("Gift cards fetch error:", res.status);
        return;
      }
      const json = await res.json();
      setGiftCards(json.cards || []);
    } catch (e) {
      console.error("Gift cards fetch error:", e);
    } finally {
      setLoadingGiftCards(false);
    }
  }

  async function loadGiftCards() {
    if (!email) return;
    setLoadingGiftCards(true);
    try {
      const res = await fetch(`/api/account/giftcards?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
      });
      const j = await res.json();
      if (res.ok) {
        setGiftCards(j.cards || []);
      } else {
        toast.error(j.error || "Failed to load gift cards");
      }
    } catch (e: any) {
      toast.error("Failed to load gift cards");
    } finally {
      setLoadingGiftCards(false);
    }
  }

  async function verifyGiftCard() {
    if (!verifyCode.trim()) {
      toast.error("Please enter a gift card code");
      return;
    }
    setVerifying(true);
    setVerifiedCard(null);
    try {
      const res = await fetch(`/api/giftcard/verify?code=${encodeURIComponent(verifyCode.trim().toUpperCase())}`, {
        cache: "no-store",
      });
      const j = await res.json();
      if (res.ok && j.valid) {
        setVerifiedCard(j.card);
        toast.success(`Valid gift card! Remaining: $${(j.card.remaining_amount / 100).toFixed(2)} CAD`);
      } else {
        setVerifiedCard(null);
        toast.error(j.error === "not found" ? "Gift card not found" : "Invalid gift card code");
      }
    } catch (e: any) {
      toast.error("Failed to verify gift card");
    } finally {
      setVerifying(false);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard!");
    } catch (e) {
      toast.error("Failed to copy code");
    }
  }

  function downloadPdf(code: string) {
    window.open(`/api/giftcard/pdf?code=${encodeURIComponent(code)}`, "_blank");
    toast.success("Downloading PDF...");
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
            Save your contact info. When you book, we'll prefill your details.
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
                We'll also prefill your info during booking.
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

        {/* Gift Cards */}
        <section className="rounded-xl border bg-white p-4 md:p-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">Gift Cards & Wallet</h2>
                <button
                  onClick={fetchGiftCards}
                  disabled={loadingGiftCards}
                  className="btn btn-sm btn-ghost"
                >
                  {loadingGiftCards ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              {loadingGiftCards ? (
                <p className="text-sm text-zinc-500">Loading...</p>
              ) : giftCards.length === 0 ? (
                <p className="text-sm text-zinc-500">No gift cards found</p>
              ) : (
                <div className="space-y-3">
                  {giftCards.map((card) => {
                    let statusDisplay;
                    let statusColor;

                    if (card.remaining_amount === 0) {
                      statusDisplay = "Fully Redeemed";
                      statusColor = "bg-zinc-100 text-zinc-600";
                    } else if (card.remaining_amount < card.amount) {
                      statusDisplay = "Partially Used";
                      statusColor = "bg-amber-100 text-amber-700";
                    } else if (card.status === "Expired") {
                      statusDisplay = "Expired";
                      statusColor = "bg-red-100 text-red-700";
                    } else {
                      statusDisplay = "Active";
                      statusColor = "bg-green-100 text-green-700";
                    }

                    const usedAmount = card.amount - card.remaining_amount;
                    const usagePercent = card.amount > 0 ? (usedAmount / card.amount) * 100 : 0;

                    return (
                      <motion.div
                        key={card.code}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/*卡号和状态*/}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono font-semibold text-lg">{card.code}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
                                {statusDisplay}
                              </span>
                            </div>
                            {/*金额信息*/}
                            <div className="space-y-1">
                              <div className="flex items-center gap-3 text-sm">
                                <span className="text-zinc-600">Original:</span>
                                <span className="font-medium">${(card.amount / 100).toFixed(2)} CAD</span>
                              </div>
                              {card.remaining_amount < card.amount && (
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-zinc-600">Remaining:</span>
                                  <span className="font-bold text-greeen-600">
                                    ${(card.remaining_amount / 100).toFixed(2)} CAD
                                  </span>
                                </div>
                              )}
                              {/*使用进度条*/}
                              {usagePercent > 0 && usagePercent < 100 && (
                                <div className="mt-2">
                                  <div className="w-full bg-grey-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${100 - usagePercent}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-zinc-500 mt-1">
                                    {(100 - usagePercent).toFixed(0)}% remaining
                                  </p>
                                </div>
                              )}
                            </div>
                            {/*元信息*/}
                            <div className="mt-2 text-xs text-zinc-500 space-y-0.5">
                              {card.recipient_name && (
                                <div>To: {card.recipient_name}</div>
                              )}
                              {card.sender_name && (
                                <div>From: {card.sender_name}</div>
                              )}
                              {card.message && (
                                <div className="italic">"{card.message}"</div>
                              )}
                              <div>{dayjs(card.created_at).format("MMM D, YYYY")}</div>
                            </div>
                          </div>
                          {/*操作按钮*/}
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => copyCode(card.code)}
                              className="btn btn-sm btn-ghost px-2 hover:bg-grey-100"
                              title="Copy code"
                              >
                                📋
                              </button>
                              <button
                                onClick={() => downloadPdf(card.code)}
                                className="btn btn-sm btn-ghost px-2 hover:bg-gray-100"
                                title="Download PDF"
                                >
                                📥
                                </button>
                                {card.remaining_amount > 0 && (
                                  <button
                                    onClick={() => {
                                      //可以添加快速兑换功能
                                      toast.success("Use this code at checkout!");
                                    }}
                                    className="btn btn-sm btn-ghost px-2 hover:bg-green-100"
                                    title="Use gift card"
                                    >
                                      💳
                                    </button>
                                )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
            {/*钱包余额汇总*/}
            {giftCards.length > 0 && (
              <div className="mt-4 p-3 bg-grey-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-grey-700">Total Wallet Balance:</span>
                  <span className="text-lg font-bold text-green-600">
                    ${(giftCards.reduce((sum, card) => sum + card.remaining_amount, 0) / 100).toFixed(2)} CAD
                  </span>
                </div>
              </div>
            )}
            <div className="mt-4">
              <a href="/gift-card" className="btn btn-primary">
              Purchase a new gift card
              </a>
            </div>
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
              onChange={(e) => setClsType(e.target.value as ClassType)}
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
            <button
              className="btn btn-ghost"
              onClick={async () => {
                await loadSlots();
                await loadMyDayBookings();
              }}
              disabled={loadingSlots}
            >
              {loadingSlots ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {loadingSlots ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="rounded border p-3 bg-zinc-100 animate-pulse h-28"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {slots.map((s) => {
                const key = `${s.start}-${s.end}`;
                const isBusy = busySlots.has(key);
                const left = Math.max(0, s.capacity - s.count);
                const full = left === 0;
                const isMine = myStarts.has(s.start);
                const status = s.status ?? "scheduled";
                const ready = s.count >= s.capacity;
                const conflict = !isMine
                  ? myDayBookings.find((b) => b.start === s.start && b.class_type !== clsType)
                  : undefined;

                return (
                  <motion.div
                    key={key}
                    className="rounded border p-3 bg-white/80"
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  >
                    <div className="font-medium">
                      {s.start}–{s.end}
                    </div>
                    <div className="text-sm text-zinc-600 mt-1">
                      {s.count}/{s.capacity} signed up{" "}
                      {ready && <span className="text-green-600">• Ready to run</span>}
                      {conflict && (
                        <span className="ml-2 text-amber-600">• Time conflict (signed up for {conflict.class_type})</span>
                      )}
                    </div>
                    <motion.button
                      className={`btn w-full mt-2 transition-all ${
                        isMine
                          ? isBusy
                            ? "btn-outline opacity-70 cursor-wait"
                            : "btn-outline"
                          : full || status !== "scheduled" || !!conflict
                          ? "btn-disabled"
                          : isBusy
                          ? "btn-primary opacity-70 cursor-wait"
                          : "btn-primary"
                      }`}
                      disabled={
                        isBusy ||
                        (status !== "scheduled" && !isMine) ||
                        (s.capacity - s.count <= 0 && !isMine) ||
                        (!!conflict && !isMine)
                      }
                      onClick={() => signUpForSlot(s)}
                      title={conflict ? `You've already signed up for ${conflict.class_type} at this time` : ""}
                      whileTap={{ scale: 0.98 }}
                      whileHover={(!isMine && !full && status === "scheduled" && !conflict) ? { y: -1 } : {}}
                    >
                      {isBusy
                        ? isMine
                          ? "Withdrawing..."
                          : "Joining..."
                        : isMine
                        ? "Withdraw"
                        : status !== "scheduled"
                        ? status === "cancelled"
                          ? "Cancelled"
                          : "Closed"
                        : full
                        ? "Full"
                        : conflict
                        ? "Time conflict"
                        : "Sign up"}
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}