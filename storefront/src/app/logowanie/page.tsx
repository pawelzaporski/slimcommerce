'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, loginClient } from '@/lib/api';
import { setToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { token } = await loginClient(email, password);
      setToken(token);
      router.push('/konto');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Wystąpił błąd, spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Zaloguj się</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 block w-full rounded border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="block text-sm">
          Hasło
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 block w-full rounded border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black px-5 py-2.5 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {loading ? 'Logowanie…' : 'Zaloguj się'}
        </button>
      </form>
      <p className="mt-4 text-sm text-black/60 dark:text-white/60">
        Nie masz konta?{' '}
        <Link href="/rejestracja" className="underline">
          Zarejestruj się
        </Link>
        .
      </p>
    </div>
  );
}
