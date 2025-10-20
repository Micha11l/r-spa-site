"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser(); // <-- 必须调用函数
    sb.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      const sb = supabaseBrowser(); // <-- 这里也要调用函数
      await sb.auth.signOut();
      window.location.href = "/sign-in";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card space-y-3">
      <h2 className="h2">My account</h2>
      <p className="text-sm text-zinc-600">Signed in as {email ?? "—"}</p>
      <button className="btn" onClick={signOut} disabled={loading}>
        {loading ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}
