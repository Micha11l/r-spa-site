"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignInForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      window.location.href = "/account"; // ✅ 登录成功去 /account
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="block text-sm mb-1">Email</label>
        <input className="w-full" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm mb-1">Password</label>
        <input className="w-full" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <button className="btn btn-primary w-full sm:w-auto" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-sm text-zinc-600">
        Don’t have an account? <a href="/sign-up" className="underline">Create one</a>
      </p>
    </form>
  );
}