'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getMe } from '@/lib/api';
import { clearToken, getToken } from '@/lib/auth';
import type { Client } from '@/lib/types';

export default function AccountPage() {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/logowanie');
      return;
    }

    getMe(token)
      .then(setClient)
      .catch(() => {
        clearToken();
        router.replace('/logowanie');
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push('/');
  }

  if (loading) {
    return <p>Wczytywanie…</p>;
  }

  if (!client) {
    return null;
  }

  return (
    <div className="max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Moje konto</h1>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-black/60 dark:text-white/60">Imię i nazwisko</dt>
          <dd>
            {client.first_name} {client.last_name}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-black/60 dark:text-white/60">E-mail</dt>
          <dd>{client.email}</dd>
        </div>
        {client.company_name && (
          <div className="flex justify-between">
            <dt className="text-black/60 dark:text-white/60">Firma</dt>
            <dd>{client.company_name}</dd>
          </div>
        )}
      </dl>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 rounded border border-black/15 px-5 py-2.5 font-medium dark:border-white/20"
      >
        Wyloguj się
      </button>
    </div>
  );
}
