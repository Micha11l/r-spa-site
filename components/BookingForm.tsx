// components/BookingForm.tsx
"use client";
import { useState } from "react";

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

const SERVICES = [
  // Therapies
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

  // Spa
  "Spa – Head (45m)",
  "Spa – Back & Shoulders (60m)",
  "Spa – Full Body (90m)",
  "Spa – Hot Stone (75m)",

  // Other
  "Private Event / Party (inquiry only)",
] as const;

export default function BookingForm() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    service: SERVICES[0],
    date: "",
    time: "",
    name: "",
    email: "",
    phone: "",
  });

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
      setOk("Thank you! Your request has been received. We'll confirm by email shortly.");
      setForm((f) => ({ ...f, notes: "" }));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 max-w-xl">
      {/* 蜜罐（隐藏） */}
      <div style={{ display: "none" }} aria-hidden="true">
        <label>Company</label>
        <input
          type="text"
          value={form.company || ""}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Service</label>
        <select
          value={form.service}
          onChange={(e) => setForm({ ...form, service: e.target.value })}
          className="w-full rounded-md border px-3 py-2"
        >
          {SERVICES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Time</label>
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            required
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Your Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Phone</label>
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Notes (optional)</label>
        <textarea
          rows={3}
          value={form.notes || ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <button className="btn btn-primary" disabled={loading}>
        {loading ? "Submitting..." : "Confirm Appointment"}
      </button>

      {ok && <div className="text-green-600">{ok}</div>}
      {err && <div className="text-red-600">{err}</div>}

      <small>
        By booking, you acknowledge these are wellness sessions, not medical treatment.
      </small>
    </form>
  );
}