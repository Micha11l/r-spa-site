"use client";

import { supabaseBrowser } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";

export default function AccountPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const sb = supabaseBrowser;
    sb.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const signOut = async () => {
    const sb = supabaseBrowser;
    await sb.auth.signOut();
    window.location.href = "/";
  };

  return (
    <section className="section">
      <div className="container">
        <h1 className="h1 mb-4">My account</h1>
        <p className="mb-6 text-zinc-600">Signed in as {email ?? "…"}</p>
        <button className="btn" onClick={signOut}>Sign out</button>
      </div>
    </section>
  );
}