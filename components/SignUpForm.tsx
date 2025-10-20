"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Form = {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  month?: string;
  day?: string;
  year?: string;
  street?: string;
  city?: string;
  postal?: string;
  country?: string;
  marketing_email?: boolean;
  marketing_mail?: boolean;
};

export default function SignUpForm() {
  // ！！确保这里调用的是函数：supabaseBrowser()
  const supabase = supabaseBrowser();

  const [step, setStep] = useState<"form" | "code" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [form, setForm] = useState<Form>({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    month: "",
    day: "",
    year: "",
    street: "",
    city: "",
    postal: "",
    country: "",
    marketing_email: true,
    marketing_mail: false,
  });

  const onChange =
    (k: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.type === "checkbox" ? !!e.target.checked : e.target.value;
      setForm((s) => ({ ...s, [k]: v }));
    };

  const buildDob = () => {
    const yyyy = (form.year || "").trim();
    const mm = (form.month || "").trim();
    const dd = (form.day || "").trim();
    if (yyyy && mm && dd) return `${yyyy.padStart(4, "0")}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    return null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const emailTrim = form.email.trim();
      const dob = buildDob();

      const { error } = await supabase.auth.signInWithOtp({
        email: emailTrim,
        options: {
          shouldCreateUser: true,
          emailRedirectTo:
            (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin) + "/sign-in",
          data: {
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone,
            dob,
            address: {
              street: form.street,
              city: form.city,
              postal: form.postal,
              country: form.country,
            },
            marketing_email: !!form.marketing_email,
            marketing_mail: !!form.marketing_mail,
          },
        },
      });
      if (error) throw error;

      setEmail(emailTrim);
      setStep("code");
    } catch (err: any) {
      setError(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "email", // 6 位邮箱验证码
      });
      if (error) throw error;

      const session = data.session;
      if (!session || !data.user) throw new Error("No session after OTP verification.");

      // 把资料落库（服务端路由做 RLS 安全）
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        dob: buildDob(),
        street: form.street,
        city: form.city,
        postal: form.postal,
        country: form.country,
        marketing_email: !!form.marketing_email,
        marketing_mail: !!form.marketing_mail,
      };

      await fetch("/api/profile/upsert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      setStep("done");
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="card">
        <h2 className="h2 mb-2">Welcome!</h2>
        <p>Account created successfully. You can now book faster and manage your appointments.</p>
      </div>
    );
  }

  return step === "form" ? (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 表单主栅格 */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">First name *</label>
          <input required value={form.first_name} onChange={onChange("first_name")} className="w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1">Last name *</label>
          <input required value={form.last_name} onChange={onChange("last_name")} className="w-full" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Email *</label>
          <input required type="email" value={form.email} onChange={onChange("email")} className="w-full" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Phone *</label>
          <input required inputMode="tel" value={form.phone} onChange={onChange("phone")} className="w-full" />
        </div>

        {/* DOB */}
        <div>
          <label className="block text-sm mb-1">Month</label>
          <input
            placeholder="MM"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            value={form.month}
            onChange={onChange("month")}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Day</label>
          <input
            placeholder="DD"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            value={form.day}
            onChange={onChange("day")}
            className="w-full"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Year</label>
          <input
            placeholder="YYYY"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={form.year}
            onChange={onChange("year")}
            className="w-full"
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Street</label>
          <input value={form.street} onChange={onChange("street")} className="w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1">City</label>
          <input value={form.city} onChange={onChange("city")} className="w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1">ZIP/Postal code</label>
          <input value={form.postal} onChange={onChange("postal")} className="w-full" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Country</label>
          <input value={form.country} onChange={onChange("country")} className="w-full" />
        </div>

        {/* ✅ Marketing：放在 grid 内，占满两列，避免重叠 */}
        <div className="md:col-span-2">
          <fieldset className="rounded border p-4 text-sm space-y-3">
            <div className="flex items-start gap-3">
              <input
                id="mk-email"
                type="checkbox"
                className="mt-1"
                checked={!!form.marketing_email}
                onChange={onChange("marketing_email")}
              />
              <label htmlFor="mk-email" className="leading-5 flex-1">
                Yes, I&apos;d like to receive updates by email
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="mk-mail"
                type="checkbox"
                className="mt-1"
                checked={!!form.marketing_mail}
                onChange={onChange("marketing_mail")}
              />
              <label htmlFor="mk-mail" className="leading-5 flex-1">
                Yes, I&apos;d like to receive updates by mail
              </label>
            </div>
          </fieldset>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button className="btn btn-primary w-full md:w-auto" disabled={loading}>
        {loading ? "Sending code..." : "Create account"}
      </button>

      <p className="text-sm text-zinc-600">
        Already have an account?{" "}
        <a className="underline" href="/sign-in">
          Sign in
        </a>
      </p>
    </form>
  ) : (
    <form onSubmit={handleVerify} className="space-y-4">
      <h2 className="h2">Check your email</h2>
      <p className="text-sm text-zinc-600">
        We’ve sent a 6-digit verification code to <b>{email}</b>.
      </p>
      <div>
        <label className="block text-sm mb-1">Verification code</label>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          className="w-full"
        />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button className="btn btn-primary" disabled={loading}>
        {loading ? "Verifying..." : "Verify & Complete"}
      </button>
      <button
        type="button"
        className="ml-3 underline text-sm"
        onClick={async () => {
          setError(null);
          await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: true },
          });
        }}
      >
        Resend code
      </button>
    </form>
  );
}
