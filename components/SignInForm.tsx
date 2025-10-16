'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [password, setPwd]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // TODO: 换成你真实的登录接口
      const r = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) throw new Error('Invalid email or password');

      // 登录成功后跳去你想要的页面（先占位）
      router.push('/account'); // 或 /admin
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm grid gap-4">
      <label className="block">
        <span className="text-sm">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border px-3 py-2 focus:outline-none"
          placeholder="you@example.com"
        />
      </label>

      <label className="block">
        <span className="text-sm">Password</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPwd(e.target.value)}
          className="mt-1 w-full border px-3 py-2 focus:outline-none"
          placeholder="••••••••"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}