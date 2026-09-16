import type { Metadata } from 'next';
import { Suspense } from 'react';
import SearchResults from '@/components/SearchResults';

export const metadata: Metadata = {
  title: 'Szukaj',
  robots: { index: false },
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-x py-8 text-sm text-muted">Wczytywanie…</div>}>
      <SearchResults />
    </Suspense>
  );
}
