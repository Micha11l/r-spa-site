"use client";
import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const session_id = typeof window !== "undefined" ? new URLSearchParams(location.search).get("session_id") : null;

  useEffect(() => {
    if (!session_id) {
      setError("Missing session ID");
      setLoading(false);
      return;
    }
    
    fetch(`/api/giftcard/lookup?session_id=${session_id}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: "Failed to load gift card" }));
          throw new Error(err.error || "Gift card not found");
        }
        return r.json();
      })
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setInfo(data);
        }
      })
      .catch((e) => {
        setError(e.message || "Failed to load gift card");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session_id]);

  if (loading) return <main className="p-8">Loading…</main>;
  
  if (error || !info || !info.code) {
    return (
      <main className="mx-auto max-w-lg p-8 space-y-4">
        <h1 className="text-2xl font-semibold">Gift Card Processing</h1>
        <p className="text-red-600">
          {error || "Gift card information not available. Please check your email or contact support."}
        </p>
        <p className="text-sm text-zinc-600">
          If you just completed payment, it may take a few moments to process. Please check your email for the gift card details.
        </p>
      </main>
    );
  }

  const amount = info.amount ? (info.amount / 100).toFixed(2) : "0.00";

  return (
    <main className="mx-auto max-w-lg p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Gift card issued</h1>
      <p>Code: <b>{info.code}</b> · Value: ${amount} CAD</p>
      <div className="flex gap-2">
        <button 
          className="btn btn-primary" 
          onClick={() => {
            navigator.clipboard.writeText(info.code);
            alert("Code copied!");
          }}
        >
          Copy Code
        </button>
        <a className="btn btn-ghost" href={`/api/giftcard/pdf?code=${info.code}`} target="_blank">
          Download PDF
        </a>
      </div>
    </main>
  );
}