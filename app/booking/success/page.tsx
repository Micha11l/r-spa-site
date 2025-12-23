// app/booking/success/page.tsx
import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export const metadata = {
  title: "Booking Received",
  description: "Your booking request has been received.",
};

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <Suspense fallback={<SuccessFallback />}>
        <SuccessClient />
      </Suspense>
    </div>
  );
}

function SuccessFallback() {
  return (
    <div className="max-w-2xl w-full">
      <div className="bg-white border-2 border-zinc-200 rounded-2xl p-8 sm:p-12 text-center">
        <div className="h-8 bg-zinc-200 rounded w-3/4 mx-auto mb-4 animate-pulse" />
        <div className="h-6 bg-zinc-200 rounded w-2/3 mx-auto mb-8 animate-pulse" />
      </div>
    </div>
  );
}
