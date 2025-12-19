// components/BookingForm.tsx
"use client";
import { useMemo, useState } from "react";

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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const createInitialFormState = (): FormState => ({
  service: SERVICES[0],
  date: "",
  time: "",
  name: "",
  email: "",
  phone: "",
  notes: "",
  company: "",
});
const createTouchedState = () => ({
  service: false,
  date: false,
  time: false,
  name: false,
  email: false,
  phone: false,
  notes: false,
});
type TouchedState = ReturnType<typeof createTouchedState>;

type BookingFormProps = {
  endpoint?: string;
  initial?: Partial<FormState>;
  onSuccess?: (data: any) => void;
  submitLabel?: string;
  hideHoneypot?: boolean;
  compact?: boolean;
};

export default function BookingForm({
  endpoint = "/api/book",
  initial = {},
  onSuccess,
  submitLabel = "Confirm Appointment",
  hideHoneypot = false,
  compact = false,
}: BookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...createInitialFormState(), ...initial });
  const [touched, setTouched] = useState<TouchedState>(createTouchedState());
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const formErrors = useMemo(
    () => ({
      service: "",
      date: form.date ? "" : "Choose a date for your visit.",
      time: form.time ? "" : "Select a preferred time.",
      name: form.name.trim() ? "" : "Your name is required.",
      email: emailRegex.test(form.email) ? "" : "Enter a valid email address.",
      phone: form.phone.trim().length >= 7 ? "" : "Phone number is required.",
      notes: "",
    }),
    [form],
  );

  const showFieldError = (field: keyof typeof formErrors) =>
    (touched[field] || submitAttempted) && formErrors[field] ? formErrors[field] : "";

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    setLoading(true);
    setOk(null);
    setErr(null);
    const hasErrors = Object.values(formErrors).some(Boolean);
    if (hasErrors) {
      setLoading(false);
      setErr("Please fix the highlighted fields.");
      return;
    }
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      if (onSuccess) {
        onSuccess(data);
      } else {
        setOk("Thank you! Your request has been received. We'll confirm by email shortly.");
      }

      setForm(createInitialFormState());
      setTouched(createTouchedState());
      setSubmitAttempted(false);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const gapClass = compact ? "gap-3" : "gap-4";

  return (
    <form onSubmit={submit} className={`grid ${gapClass} max-w-xl`} noValidate aria-live="polite">
      {/* 蜜罐（隐藏） */}
      {!hideHoneypot && (
        <div style={{ display: "none" }} aria-hidden="true">
          <label htmlFor="booking-company">Company</label>
          <input
            id="booking-company"
            type="text"
            value={form.company || ""}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
      )}

      <div>
        <label className="block text-sm mb-1" htmlFor="booking-service">
          Service
        </label>
        <select
          id="booking-service"
          value={form.service}
          onChange={(e) => handleFieldChange("service", e.target.value)}
          onBlur={() => markTouched("service")}
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
          <label className="block text-sm mb-1" htmlFor="booking-date">
            Date
          </label>
          <input
            id="booking-date"
            type="date"
            value={form.date}
            lang="en-CA"
            placeholder="YYYY-MM-DD"
            onChange={(e) => handleFieldChange("date", e.target.value)}
            onBlur={() => markTouched("date")}
            required
            className="w-full rounded-md border px-3 py-2"
            aria-invalid={Boolean(showFieldError("date"))}
            aria-describedby={showFieldError("date") ? "booking-date-error" : undefined}
          />
          {showFieldError("date") && (
            <p id="booking-date-error" className="mt-1 text-sm text-red-600">
              {showFieldError("date")}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="booking-time">
            Time
          </label>
          <input
            id="booking-time"
            type="time"
            value={form.time}
            onChange={(e) => handleFieldChange("time", e.target.value)}
            onBlur={() => markTouched("time")}
            required
            className="w-full rounded-md border px-3 py-2"
            aria-invalid={Boolean(showFieldError("time"))}
            aria-describedby={showFieldError("time") ? "booking-time-error" : undefined}
          />
          {showFieldError("time") && (
            <p id="booking-time-error" className="mt-1 text-sm text-red-600">
              {showFieldError("time")}
            </p>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1" htmlFor="booking-name">
            Your Name
          </label>
          <input
            id="booking-name"
            value={form.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            onBlur={() => markTouched("name")}
            required
            className="w-full rounded-md border px-3 py-2"
            autoComplete="name"
            aria-invalid={Boolean(showFieldError("name"))}
            aria-describedby={showFieldError("name") ? "booking-name-error" : undefined}
          />
          {showFieldError("name") && (
            <p id="booking-name-error" className="mt-1 text-sm text-red-600">
              {showFieldError("name")}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="booking-email">
            Email
          </label>
          <input
            id="booking-email"
            type="email"
            value={form.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            onBlur={() => markTouched("email")}
            required
            className="w-full rounded-md border px-3 py-2"
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(showFieldError("email"))}
            aria-describedby={showFieldError("email") ? "booking-email-error" : undefined}
          />
          {showFieldError("email") && (
            <p id="booking-email-error" className="mt-1 text-sm text-red-600">
              {showFieldError("email")}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="booking-phone">
          Phone
        </label>
        <input
          id="booking-phone"
          value={form.phone}
          onChange={(e) => handleFieldChange("phone", e.target.value)}
          onBlur={() => markTouched("phone")}
          required
          className="w-full rounded-md border px-3 py-2"
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={Boolean(showFieldError("phone"))}
          aria-describedby={showFieldError("phone") ? "booking-phone-error" : undefined}
        />
        {showFieldError("phone") && (
          <p id="booking-phone-error" className="mt-1 text-sm text-red-600">
            {showFieldError("phone")}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="booking-notes">
          Notes (optional)
        </label>
        <textarea
          id="booking-notes"
          rows={3}
          value={form.notes || ""}
          onChange={(e) => handleFieldChange("notes", e.target.value)}
          onBlur={() => markTouched("notes")}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <button className="btn btn-primary" disabled={loading}>
        {loading ? "Submitting..." : submitLabel}
      </button>

      {ok && <div className="text-green-600">{ok}</div>}
      {err && <div className="text-red-600">{err}</div>}

      <small>
        By booking, you acknowledge these are wellness sessions, not medical treatment.
      </small>
    </form>
  );
}
