"use client";
import { useState } from "react";

const THERAPIES = [
  "Seqex Session (27m)",
  "Seqex Session – Double (58m)",
  "Seqex Personalized Test (80m)",
  "Personalized Test & Card (80m)",
  "ICR Treatment (12m)",
  "Amygdala Flush (custom)",
  "Special Treatment (custom)",
  "RX1 Seat (20m)",
  "Vitamin D UVB (4m)",
  "LifeForce (60m)",
] as const;

const SPA = [
  "Spa – Head (45m)",
  "Spa – Back & Shoulders (60m)",
  "Spa – Full Body (90m)",
  "Spa – Hot Stone (75m)",
] as const;

const OTHER = ["Private Event / Party (inquiry only)"] as const;

type FormState = {
  service: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  company?: string; // 蜜罐
};

export default function BookingForm() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    service: THERAPIES[0], // 默认第一个服务
    date: "",
    time: "",
    name: "",
    email: "",
    phone: "",
    notes: "",
    company: "", // 蜜罐
  });

  function update<K extends keyof FormState>(
    key: K
  ): React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
    return (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOk(null);
    setErr(null);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setOk(
        "Thank you! Your request has been received. We'll confirm by email shortly."
      );
      // 可选：清空可选项但保留选择的服务
      setForm((p) => ({ ...p, notes: "", company: "" }));
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 max-w-xl">
      {/* Service */}
      <div>
        <label className="block text-sm font-medium">Service</label>
        <select
          className="mt-1 w-full rounded-md border px-3 py-2"
          value={form.service}
          onChange={update("service")}
          required
        >
          <optgroup label="Therapies">
            {THERAPIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </optgroup>
          <optgroup label="Spa">
            {SPA.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </optgroup>
          <optgroup label="Other">
            {OTHER.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Date / Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Date</label>
          <input
            type="date"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={form.date}
            onChange={update("date")}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Time</label>
          <input
            type="time"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={form.time}
            onChange={update("time")}
            required
          />
        </div>
      </div>

      {/* Name / Email */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Your Name</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={form.name}
            onChange={update("name")}
            minLength={2} // 配合后端 zod 校验
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={form.email}
            onChange={update("email")}
            autoComplete="email"
            required
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium">Phone</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2"
          value={form.phone}
          onChange={update("phone")}
          inputMode="tel"
          autoComplete="tel"
          required
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium">Notes (optional)</label>
        <textarea
          rows={3}
          className="mt-1 w-full rounded-md border px-3 py-2"
          value={form.notes || ""}
          onChange={update("notes")}
        />
      </div>

      {/* 蜜罐（隐藏字段，防机器人） */}
      <div className="hidden" aria-hidden="true">
        <label>Company</label>
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.company || ""}
          onChange={update("company")}
        />
      </div>

      <button
        className="btn btn-primary disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Submitting..." : "Confirm Appointment"}
      </button>

      {ok && <div className="text-green-600">{ok}</div>}
      {err && <div className="text-red-600">{err}</div>}

      <small className="text-zinc-500">
        By booking, you acknowledge these are wellness sessions, not medical
        treatment.
      </small>
    </form>
  );
}