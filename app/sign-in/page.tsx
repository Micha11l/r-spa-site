import { Suspense } from "react";
import SignInForm from "@/components/SignInForm";

function SignInFormFallback() {
  return <div className="text-sm text-zinc-600">Loading…</div>;
}

export default function SignInPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="h1 mb-6">Sign in</h1>
      <Suspense fallback={<SignInFormFallback />}>
        <SignInForm />
      </Suspense>
    </main>
  );
}