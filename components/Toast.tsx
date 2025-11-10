"use client";
import React from "react";
import { createPortal } from "react-dom";

type T = { id: number; text: string; tone?: "success"|"warn"|"error" };

export function useToast() {
  const ctx = React.useContext(ToastCtx)!;
  return React.useMemo(
    () => ({
      success: (text: string) => ctx.push({ text, tone: "success" }),
      warn:    (text: string) => ctx.push({ text, tone: "warn" }),
      error:   (text: string) => ctx.push({ text, tone: "error" }),
    }),
    [ctx]
  );
}

const ToastCtx = React.createContext<{ push: (t: Omit<T,"id">) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<T[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const idRef = React.useRef(1);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const push = (t: Omit<T,"id">) => {
    const it: T = { id: idRef.current++, ...t };
    setItems((s) => [...s, it]);
    // 3.5s 自动消失
    setTimeout(() => setItems((s) => s.filter(x => x.id !== it.id)), 3500);
  };

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      {isMounted &&
        createPortal(
          <div className="fixed right-4 top-4 z-[1000] space-y-2">
            {items.map((it) => (
              <div
                key={it.id}
                className={[
                  "min-w-[260px] max-w-[360px] rounded-xl border px-4 py-3 shadow-lg text-sm",
                  "animate-[toast-in_120ms_ease-out]",
                  it.tone === "success" ? "border-green-200 bg-green-50 text-green-800" :
                  it.tone === "warn"    ? "border-amber-200 bg-amber-50 text-amber-900" :
                                           "border-red-200 bg-red-50 text-red-800"
                ].join(" ")}
              >
                {it.text}
              </div>
            ))}
          </div>,
          document.body
        )}
      <style>{`
        @keyframes toast-in { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity:1; transform: none; } }
      `}</style>
    </ToastCtx.Provider>
  );
}