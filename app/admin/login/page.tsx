// app/admin/login/page.tsx
import type { Metadata } from "next";

// 这页不希望被索引，同时避免 SSG 直接强制动态
export const metadata: Metadata = {
  title: "Admin · Login",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const raw = searchParams?.next ?? "/admin";
  // 防止双重编码/奇怪值
  const next =
    typeof raw === "string" && raw.startsWith("/")
      ? decodeURIComponent(raw)
      : "/admin";

  return (
    <section className="section">
      <div className="container max-w-md">
        <h1 className="h2 mb-4">Admin login</h1>
        <p className="text-ash mb-6">
          Enter the passcode to access the internal schedule.
        </p>
        <LoginForm next={next} />
      </div>
    </section>
  );
}

/** Client 子组件：提交到 /api/admin/login，成功后跳转到 next */
function LoginForm({ next }: { next: string }) {
  "use client";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pass = String(fd.get("pass") || "");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pass }),
    });

    if (res.ok) {
      window.location.href = next; // 登录成功，按传入的 next 跳转
    } else {
      const el = e.currentTarget.querySelector<HTMLParagraphElement>("#err");
      if (el) el.textContent = "Invalid passcode";
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <input
        name="pass"
        type="password"
        placeholder="Passcode"
        autoComplete="current-password"
        className="w-full border border-ink/20 bg-paper px-3 py-2 focus:outline-none focus:border-ink"
        required
      />
      <button className="btn btn-primary">Sign in</button>
      <p id="err" className="text-red-600 text-sm h-5" />
      <input type="hidden" name="next" value={next} />
    </form>
  );
}