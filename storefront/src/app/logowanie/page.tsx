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
    <div className="container-x py-10">
      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
        <div className="card p-8">
          <h1 className="display text-3xl">Zaloguj się</h1>
          <p className="mt-2 text-sm text-muted">Masz już konto? Wpisz swoje dane.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="field-label">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="password" className="field-label">
                Hasło
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field"
              />
            </div>

            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

            <button type="submit" disabled={loading} className="btn btn-brand btn-lg w-full">
              {loading ? 'Logowanie…' : 'Zaloguj się'}
            </button>
          </form>
        </div>

        <div className="flex flex-col justify-center rounded-3xl bg-rose-light p-8">
          <h2 className="display text-3xl">Nie masz konta?</h2>
          <ul className="mt-4 space-y-2 text-sm text-ink/80">
            <li>• szybsze składanie zamówień,</li>
            <li>• zapamiętane dane do wysyłki,</li>
            <li>• historia zakupów w jednym miejscu.</li>
          </ul>
          <Link href="/rejestracja" className="btn btn-black mt-6 self-start">
            Załóż konto
          </Link>
        </div>
      </div>
    </div>
  );
}
