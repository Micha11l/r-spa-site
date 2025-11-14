"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Mode = "sign-in" | "sign-up";

export default function AuthCard({ mode }: { mode: Mode }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/account";

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => { emailRef.current?.focus(); }, []);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null); setLoading(true);
    const sb = createClient(); // ✅ 调用函数，得到 SupabaseClient
    try {
      if (mode === "sign-in") {
        const { error } = await sb.auth.signInWithPassword({ email, password: pwd });
        if (error) throw error;
        setMsg("Signed in. Redirecting…");
        router.replace(next);
      } else {
        const { data, error } = await sb.auth.signUp({
          email,
          password: pwd,
          options: {
            emailRedirectTo:
              typeof window !== "undefined" ? `${window.location.origin}/sign-in` : undefined,
          },
        });
        if (error) throw error;

        if (data.user && !data.session) {
          setMsg("Sign-up successful. Please check your email to confirm your account.");
        } else {
          setMsg("Sign-up successful. Redirecting…");
          router.replace(next);
        }
      }
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [email, pwd, mode, next, router]);

  const sendReset = useCallback(async () => {
    const sb = createClient(); // ✅ 这里也要调用
    try {
      setErr(null); setMsg(null); setLoading(true);
      await sb.auth.resetPasswordForEmail(email, {
        redirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/sign-in` : undefined,
      });
      setMsg("Reset link sent. Please check your email.");
    } catch (e: any) {
      setErr(e?.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }, [email]);

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-2 gap-8">
      {/* 左侧：表单卡片 */}
      <div className="order-2 md:order-1">
        <h1 className="h1 mb-2">{mode === "sign-in" ? "Sign in" : "Create an account"}</h1>
        <p className="text-zinc-600 mb-6">
          {mode === "sign-in" ? "Use your email and password to sign in."
                              : "Sign up with your email and a password."}
        </p>

        <form onSubmit={onSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              ref={emailRef}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                required
                minLength={6}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs underline"
                onClick={() => setShowPwd(v => !v)}
                aria-label="Toggle password"
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
            {mode === "sign-up" && (
              <small className="block text-ash mt-1">At least 6 characters.</small>
            )}
          </div>

          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Please wait…" : (mode === "sign-in" ? "Sign in" : "Create account")}
          </button>

          {mode === "sign-in" && (
            <div className="flex items-center justify-between text-sm">
              <span />
              <button type="button" onClick={sendReset} className="underline">
                Forgot password?
              </button>
            </div>
          )}

          {err && <div className="text-red-600 text-sm">{err}</div>}
          {msg && <div className="text-green-600 text-sm">{msg}</div>}

          <div className="text-sm text-zinc-600 pt-2">
            {mode === "sign-in" ? (
              <>No account? <a href={`/sign-up?next=${encodeURIComponent(next)}`} className="underline">Create one</a>.</>
            ) : (
              <>Already have an account? <a href={`/sign-in?next=${encodeURIComponent(next)}`} className="underline">Sign in</a>.</>
            )}
          </div>
        </form>
      </div>

      {/* 右侧：插图/品牌文案 */}
      <div className="order-1 md:order-2">
        <div className="hidden md:block aspect-[4/3] w-full bg-[url('/gallery/seqex-main.png')] bg-cover bg-center rounded border" />
        <div className="mt-4 text-sm text-zinc-600">
          Secure sign-in powered by Supabase Auth.
        </div>
      </div>
    </div>
  );
}
