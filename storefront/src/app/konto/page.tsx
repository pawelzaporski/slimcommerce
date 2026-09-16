'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BagIcon, HeartIcon, UserIcon } from '@/components/icons';
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
    return <div className="container-x py-8 text-sm text-muted">Wczytywanie…</div>;
  }

  if (!client) {
    return null;
  }

  return (
    <div className="container-x py-6 md:py-8">
      <Breadcrumbs items={[{ label: 'Moje konto' }]} />
      <h1 className="display mb-1 mt-3 text-3xl md:text-4xl">Cześć, {client.first_name}!</h1>
      <p className="mb-8 text-sm text-muted">To jest Twoje konto w sklepie.</p>

      <div className="grid gap-6 md:grid-cols-[1fr_20rem]">
        <section className="card p-6">
          <h2 className="display flex items-center gap-2 text-xl">
            <UserIcon size={20} /> Twoje dane
          </h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="field-label">Imię i nazwisko</dt>
              <dd className="font-semibold">
                {client.first_name} {client.last_name}
              </dd>
            </div>
            <div>
              <dt className="field-label">E-mail</dt>
              <dd className="font-semibold">{client.email}</dd>
            </div>
            {client.company_name && (
              <div>
                <dt className="field-label">Firma</dt>
                <dd className="font-semibold">{client.company_name}</dd>
              </div>
            )}
            {client.nip && (
              <div>
                <dt className="field-label">NIP</dt>
                <dd className="font-semibold">{client.nip}</dd>
              </div>
            )}
            <div>
              <dt className="field-label">Typ klienta</dt>
              <dd className="font-semibold uppercase">{client.client_type}</dd>
            </div>
            {Number(client.discount_percent) > 0 && (
              <div>
                <dt className="field-label">Rabat</dt>
                <dd className="font-semibold text-brand">{client.discount_percent}%</dd>
              </div>
            )}
          </dl>

          <button type="button" onClick={handleLogout} className="btn btn-outline mt-8">
            Wyloguj się
          </button>
        </section>

        <aside className="space-y-4">
          <Link href="/koszyk" className="card flex items-center gap-4 p-5 transition hover:border-brand">
            <span className="rounded-full bg-rose-light p-3 text-brand">
              <BagIcon size={22} />
            </span>
            <span>
              <span className="display block text-base">Koszyk</span>
              <span className="text-xs text-muted">Dokończ zakupy</span>
            </span>
          </Link>
          <Link href="/ulubione" className="card flex items-center gap-4 p-5 transition hover:border-brand">
            <span className="rounded-full bg-rose-light p-3 text-brand">
              <HeartIcon size={22} />
            </span>
            <span>
              <span className="display block text-base">Ulubione</span>
              <span className="text-xs text-muted">Zapisane produkty</span>
            </span>
          </Link>
          <div className="rounded-2xl bg-smoke p-5 text-xs text-muted">
            Historia zamówień pojawi się tutaj wkrótce.
          </div>
        </aside>
      </div>
    </div>
  );
}
