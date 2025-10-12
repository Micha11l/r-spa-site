// app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLogin() {
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/admin";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: pass }),
    });

    if (res.ok) {
      router.replace(next); // ← 登录成功后跳到 next（默认 /admin）
    } else {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Sign-in failed");
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="container mx-auto max-w-sm">
        <h1 className="h2 mb-4">Admin Sign-in</h1>
        <form onSubmit={submit} className="grid gap-3">
          <label>Passcode</label>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
          />
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          {err && <p className="text-red-600 text-sm">{err}</p>}
        </form>
      </div>
    </section>
  );
}