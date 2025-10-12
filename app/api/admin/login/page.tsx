"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();
  const next = useSearchParams().get("next") || "/admin";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: code }),
    });
    if (res.ok) router.replace(next);
    else setErr("Incorrect passcode");
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-semibold">Admin sign in</h1>
      <form onSubmit={submit} className="grid gap-3">
        <input
          type="password"
          placeholder="Enter admin passcode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded border p-2"
        />
        <button className="rounded bg-black px-4 py-2 text-white">Sign in</button>
        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>
    </div>
  );
}