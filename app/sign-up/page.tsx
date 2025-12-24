import { Suspense } from "react";
import type { Metadata } from "next";
import SignUpClient from "./SignUpClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <section className="section">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-8 md:grid-cols-2 items-start">
          {/* 左侧：Benefits */}
          <aside className="order-2 md:order-1">
            <h1 className="h1">Create an account</h1>
            <p className="mt-2 text-zinc-600">
              Enjoy faster checkout, track appointments, and manage your info.
            </p>

            <div className="mt-6 rounded-lg border p-5">
              <h2 className="h3 mb-3">Benefits</h2>
              <ul className="space-y-2 text-sm">
                <li>• Faster checkout</li>
                <li>• Track past & upcoming appointments</li>
                <li>• Manage contact information</li>
              </ul>
            </div>
          </aside>

          {/* 右侧：注册表单 */}
          <div className="order-1 md:order-2">
            <Suspense fallback={<div className="text-sm text-zinc-500">Loading…</div>}>
              <SignUpClient />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
