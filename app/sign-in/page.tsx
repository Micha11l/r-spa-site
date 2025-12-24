import { Suspense } from "react";
import type { Metadata } from "next";
import SignInClient from "./SignInClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return (
    <section className="section">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="h1">Sign in</h1>
          <p className="text-zinc-600 mb-6">Use your email and password to sign in.</p>
          <Suspense fallback={<div className="text-sm text-zinc-500">Loading…</div>}>
            <SignInClient />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
