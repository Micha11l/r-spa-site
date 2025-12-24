// app/packages/success/page.tsx
import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export const metadata = {
  title: "Purchase Successful",
  description: "Your package purchase was successful.",
};

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-zinc-600">Loading...</div>
    </div>
  );
}

export default function PackageSuccessPage() {
  return <Suspense fallback={<LoadingFallback />}><SuccessClient /></Suspense>;
}
