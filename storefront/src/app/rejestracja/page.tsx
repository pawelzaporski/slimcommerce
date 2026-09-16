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

  const fieldError = (name: string) =>
    errors[name] ? <p className="mt-1 text-xs font-semibold text-red-600">{errors[name]}</p> : null;

  return (
    <div className="container-x py-10">
      <div className="mx-auto max-w-xl">
        <div className="card p-8">
          <h1 className="display text-3xl">Załóż konto</h1>
          <p className="mt-2 text-sm text-muted">Zajmie to mniej niż minutę.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="field-label">
                  Imię
                </label>
                <input
                  id="first_name"
                  required
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="field"
                />
                {fieldError('first_name')}
              </div>
              <div>
                <label htmlFor="last_name" className="field-label">
                  Nazwisko
                </label>
                <input
                  id="last_name"
                  required
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="field"
                />
                {fieldError('last_name')}
              </div>
            </div>
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
              {fieldError('email')}
            </div>
            <div>
              <label htmlFor="password" className="field-label">
                Hasło
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field"
              />
              <p className="mt-1 text-xs text-muted">Minimum 6 znaków.</p>
              {fieldError('password')}
            </div>

            {errors.form && <p className="text-sm font-semibold text-red-600">{errors.form}</p>}

            <button type="submit" disabled={loading} className="btn btn-brand btn-lg w-full">
              {loading ? 'Zakładanie konta…' : 'Zarejestruj się'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Masz już konto?{' '}
            <Link href="/logowanie" className="font-semibold text-brand underline">
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
