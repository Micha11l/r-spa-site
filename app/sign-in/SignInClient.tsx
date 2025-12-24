"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignInClient() {
  const supabase = createClient();
  const searchParams = useSearchParams();
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
      const redirectParam = searchParams.get("redirect");
      const destination = redirectParam || "/account";
      window.location.href = destination;
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 max-w-xl"
      autoComplete="off"
      aria-live="polite"
    >
      <div>
        <label className="block text-sm mb-1" htmlFor="signin-email">
          Email
        </label>
        <input
          id="signin-email"
          className="w-full"
          type="email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
          autoComplete="off"
          inputMode="email"
        />
      </div>
      <div>
        <label className="block text-sm mb-1" htmlFor="signin-password">
          Password
        </label>
        <input
          id="signin-password"
          className="w-full"
          type="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
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
