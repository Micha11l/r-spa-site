import { Suspense } from "react";
import BookingClient from "./BookingClient";

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-zinc-600">Loading...</div>
          </div>
        </div>
      }
    >
      <BookingClient />
    </Suspense>
  );
}
