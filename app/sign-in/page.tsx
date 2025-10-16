import type { Metadata } from 'next';
import SignInForm from '@/components/SignInForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your account',
  alternates: { canonical: '/sign-in' },
};

export default function SignInPage() {
  return (
    <section className="section">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="h1 mb-2">Sign in</h1>
        <p className="text-zinc-600 mb-8">
          Use your email and password to sign in.
        </p>
        <SignInForm />
      </div>
    </section>
  );
}