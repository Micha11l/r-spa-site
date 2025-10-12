import type { Metadata } from "next";
import AdminCalendar from "@/components/AdminCalendar";

export const metadata: Metadata = {
  title: "Admin",
  description: "Schedule",
  robots: { index: false },
};

export default function AdminHome() {
  return (
    <section className="section">
      <div className="container mx-auto max-w-6xl px-4">
        <h1 className="mb-4 text-2xl font-semibold">Schedule</h1>

        {/* 如需退出按钮，可保留你的表单 */}
        <form action="/api/admin/logout" method="post" className="mb-6">
          <button className="rounded border px-3 py-1">Sign out</button>
        </form> 

        <AdminCalendar />
      </div>
    </section>
  );
}