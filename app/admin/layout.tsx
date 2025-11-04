// app/admin/layout.tsx
import type { Metadata } from "next";
import "../globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Admin | Rejuvenessence",
  description: "Rejuvenessence admin dashboard for managing bookings and schedules.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen bg-zinc-50 text-zinc-900">
      {children}
      <Toaster position="top-right" />
    </section>
  );
}
