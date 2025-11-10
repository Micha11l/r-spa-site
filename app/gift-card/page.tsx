"use client";
import { useState } from "react";

export default function GiftCardPage() {
  const [amount, setAmount] = useState<number | "">(150);
  const [sender_name, setSN] = useState("");
  const [sender_email, setSE] = useState("");
  const [recipient_name, setRN] = useState("");
  const [recipient_email, setRE] = useState("");
  const [message, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    // 允许空值
    if (value === "") {
      setAmount("");
      return;
    }
    // 只允许数字
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setAmount(num);
    }
  }

  function handleAmountBlur() {
    // 离开输入框时，如果为空或小于 150，自动设置为 150
    if (amount === "" || (typeof amount === "number" && amount < 150)) {
      setAmount(150);
    }
  }

  async function startCheckout() {
    const finalAmount = amount === "" ? 150 : amount;
    if (typeof finalAmount === "number" && finalAmount < 150) {
      return alert("Minimum CAD 150");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/giftcard", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ 
          amount: finalAmount, 
          sender_name, 
          sender_email, 
          recipient_name, 
          recipient_email, 
          message 
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Checkout failed");
      window.location.href = j.url;
    } catch (e:any) {
      alert(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Buy a Gift Card</h1>
      <div className="grid gap-3">
        <label className="block">Amount (CAD, min 150)
          <input 
            type="number" 
            min={150} 
            step={10} 
            value={amount === "" ? "" : amount}
            onChange={handleAmountChange}
            onBlur={handleAmountBlur}
            className="border rounded px-2 py-1 ml-2 w-32"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Your name" className="border rounded px-2 py-1" value={sender_name} onChange={e=>setSN(e.target.value)} />
          <input placeholder="Your email" className="border rounded px-2 py-1" value={sender_email} onChange={e=>setSE(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Recipient name (optional)" className="border rounded px-2 py-1" value={recipient_name} onChange={e=>setRN(e.target.value)} />
          <input placeholder="Recipient email (optional)" className="border rounded px-2 py-1" value={recipient_email} onChange={e=>setRE(e.target.value)} />
        </div>
        <textarea placeholder="Message (optional)" className="border rounded px-2 py-1" value={message} onChange={e=>setMsg(e.target.value)} />
        <button onClick={startCheckout} className="btn btn-primary" disabled={loading}>
          {loading? "Redirecting…" : "Purchase"}
        </button>
      </div>
    </main>
  );
}