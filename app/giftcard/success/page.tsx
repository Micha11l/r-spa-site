// app/giftcard/success/page.tsx
import { Suspense } from "react";
import GiftCardSuccessContent from "./GiftCardSuccessContent";

export default function GiftCardSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your gift cards...</p>
        </div>
      </div>
    }>
      <GiftCardSuccessContent />
    </Suspense>
  );
}