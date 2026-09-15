'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, registerClient } from '@/lib/api';
import { setToken } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const { token } = await registerClient({ first_name: firstName, last_name: lastName, email, password });
      setToken(token);
      router.push('/konto');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? { form: err.message });
      } else {
        setErrors({ form: 'Wystąpił błąd, spróbuj ponownie.' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Załóż konto</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          Imię
          <input
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className="mt-1 block w-full rounded border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
          {errors.first_name && <span className="text-sm text-red-600 dark:text-red-400">{errors.first_name}</span>}
        </label>
        <label className="block text-sm">
          Nazwisko
          <input
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className="mt-1 block w-full rounded border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
          {errors.last_name && <span className="text-sm text-red-600 dark:text-red-400">{errors.last_name}</span>}
        </label>
        <label className="block text-sm">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 block w-full rounded border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
          {errors.email && <span className="text-sm text-red-600 dark:text-red-400">{errors.email}</span>}
        </label>
        <label className="block text-sm">
          Hasło
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 block w-full rounded border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
          {errors.password && <span className="text-sm text-red-600 dark:text-red-400">{errors.password}</span>}
        </label>

        {errors.form && <p className="text-sm text-red-600 dark:text-red-400">{errors.form}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black px-5 py-2.5 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {loading ? 'Zakładanie konta…' : 'Zarejestruj się'}
        </button>
      </form>
      <p className="mt-4 text-sm text-black/60 dark:text-white/60">
        Masz już konto?{' '}
        <Link href="/logowanie" className="underline">
          Zaloguj się
        </Link>
        .
      </p>
    </div>
  );
}
