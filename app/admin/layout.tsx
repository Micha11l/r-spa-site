import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Admin | Rejuvenessence",
  description: "Rejuvenessence admin dashboard for managing bookings and schedules.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="max-w-7xl mx-auto py-6 px-4">
        {children}
      </main>
      {/* Toaster removed - now handled in root layout */}
    </div>
  );
}