'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductGrid from '@/components/ProductGrid';
import SearchForm from '@/components/SearchForm';
import { getProducts } from '@/lib/api';
import type { Product } from '@/lib/types';

function normalize(value: string): string {
  return value
    .toLocaleLowerCase('pl')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l');
}

/** Wyszukiwanie po stronie klienta - API nie ma endpointu wyszukiwania, filtrujemy pełną listę aktywnych produktów. */
export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setError(true));
  }, []);

  const results = useMemo(() => {
    if (!products || !query) return [];
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return products.filter((product) => {
      const haystack = normalize(
        [product.name, product.sku, ...(product.categories ?? []).map((category) => category.name)].join(' '),
      );
      return terms.every((term) => haystack.includes(term));
    });
  }, [products, query]);

  return (
    <div className="container-x py-6 md:py-8">
      <Breadcrumbs items={[{ label: 'Szukaj' }]} />
      <h1 className="display mb-4 mt-3 text-3xl md:text-4xl">
        {query ? (
          <>
            Wyniki dla: <span className="text-brand">„{query}”</span>
          </>
        ) : (
          'Szukaj produktów'
        )}
      </h1>

      <div className="mb-8 max-w-xl">
        <SearchForm key={query} initialQuery={query} autoFocus={!query} />
      </div>

      {error && <p className="text-sm text-red-600">Nie udało się pobrać produktów. Spróbuj ponownie później.</p>}
      {!error && products === null && <p className="text-sm text-muted">Wczytywanie…</p>}
      {!error && products !== null && query && (
        <ProductGrid
          products={results}
          emptyTitle="Nic nie znaleźliśmy"
          emptyText={`Brak produktów pasujących do „${query}”. Spróbuj innego hasła albo przejrzyj kategorie.`}
        />
      )}
      {!error && products !== null && !query && (
        <p className="text-sm text-muted">Wpisz nazwę produktu, SKU albo kategorię.</p>
      )}
    </div>
  );
}
