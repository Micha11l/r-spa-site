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
};

export default function BookingForm() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    service: "Seqex Session (60m)",
    date: "",
    time: "",
    name: "",
    email: "",
    phone: ""
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setOk(null); setErr(null);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setOk("Thank you! Your request has been received. We'll confirm by email shortly.");
    } catch (e:any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 max-w-xl">
      <div>
        <label>Service</label>
        <select value={form.service} onChange={e=>setForm({...form, service:e.target.value})}>
          <option>Seqex Session (60m)</option>
          <option>Seqex + Plasma Lights (75m)</option>
          <option>Plasma Lights – Targeted (20m)</option>
          <option>RX6 Full Body (40m)</option>
          <option>RX1 Seat (2 x 10m)</option>
          <option>Solarc Vitamin D UVB (4m)</option>
          <option>Vibration + Thigh Scanner (20m)</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Date</label>
          <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} required />
        </div>
        <div>
          <label>Time</label>
          <input type="time" value={form.time} onChange={e=>setForm({...form, time:e.target.value})} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Your Name</label>
          <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
        </div>
      </div>
      <div>
        <label>Phone</label>
        <input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required />
      </div>
      <div>
        <label>Notes (optional)</label>
        <textarea rows={3} value={form.notes||""} onChange={e=>setForm({...form, notes:e.target.value})} />
      </div>
      <button className="btn btn-primary" disabled={loading}>{loading? "Submitting..." : "Confirm Appointment"}</button>
      {ok && <div className="text-green-600">{ok}</div>}
      {err && <div className="text-red-600">{err}</div>}
      <small>By booking, you acknowledge these are wellness sessions, not medical treatment.</small>
    </form>
  );
}
