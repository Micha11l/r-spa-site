// app/packages/checkout/page.tsx
import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export const metadata = {
  title: "Checkout - Holiday Packages",
  description: "Complete your holiday package purchase.",
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-8">
          Checkout
        </h1>

        <Suspense fallback={<CheckoutLoadingFallback />}>
          <CheckoutClient />
        </Suspense>
      </div>
    </div>
  );
}

function CheckoutLoadingFallback() {
  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 animate-pulse">
      <div className="h-8 bg-zinc-200 rounded w-3/4 mb-4" />
      <div className="h-4 bg-zinc-200 rounded w-1/2 mb-6" />
      <div className="space-y-3">
        <div className="h-4 bg-zinc-200 rounded" />
        <div className="h-4 bg-zinc-200 rounded" />
        <div className="h-4 bg-zinc-200 rounded w-5/6" />
      </div>
    </div>
  );
}
