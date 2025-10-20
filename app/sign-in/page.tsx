// app/sign-in/page.tsx
import SignInForm from "@/components/SignInForm";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <section className="section">
      <div className="container mx-auto max-w-3xl px-4">
        <h1 className="h1">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Use your email and password to sign in.
        </p>

        <div className="mt-6">
          <SignInForm />
        </div>

        <p className="text-sm text-zinc-600 mt-6">
          Don&apos;t have an account?{" "}
          <a className="underline" href="/sign-up">
            Create one
          </a>
        </p>
      </div>
    </section>
  );
}