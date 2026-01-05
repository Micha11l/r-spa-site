import { Suspense } from "react";
import SignUpForm from "@/components/SignUpForm";

function SignUpFormFallback() {
  return <div className="text-sm text-zinc-600">Loading…</div>;
}

export default function SignUpPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="h1 mb-6">Create account</h1>
      <Suspense fallback={<SignUpFormFallback />}>
        <SignUpForm />
      </Suspense>
    </main>
  );
}