// app/maintenance/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Temporarily Offline",
  description: "We’ll be back shortly.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/maintenance" },
};

export default function MaintenancePage() {
  return (
    <section className="section">
      <div className="container mx-auto max-w-2xl">
        <h1 className="h1">We’ll be back soon</h1>
        <p className="mt-4 text-zinc-600">
          We’re doing a quick update. Please check back later. If you’re staff,
          go to <a className="underline" href="/admin">/admin</a>.
        </p>
      </div>
    </section>
  );
}