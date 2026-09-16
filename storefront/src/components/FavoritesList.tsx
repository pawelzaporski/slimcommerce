'use client';

import { useEffect, useMemo, useState } from 'react';
import ProductGrid from '@/components/ProductGrid';
import { getProducts } from '@/lib/api';
import { getFavoriteIds, onFavoritesChanged } from '@/lib/favorites';
import type { Product } from '@/lib/types';

/** Ulubione trzymane w localStorage - dopasowujemy je do aktualnej listy aktywnych produktów. */
export default function FavoritesList() {
  const [ids, setIds] = useState<number[]>([]);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const refresh = () => setIds(getFavoriteIds());
    refresh();
    return onFavoritesChanged(refresh);
  }, []);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setError(true));
  }, []);

  const favorites = useMemo(() => {
    if (!products) return [];
    const order = new Map(ids.map((id, index) => [id, index]));
    return products
      .filter((product) => order.has(product.id))
      .sort((a, b) => (order.get(b.id) ?? 0) - (order.get(a.id) ?? 0));
  }, [products, ids]);

  if (error) {
    return <p className="text-sm text-red-600">Nie udało się pobrać produktów. Spróbuj ponownie później.</p>;
  }

  if (products === null) {
    return <p className="text-sm text-muted">Wczytywanie…</p>;
  }

  return (
    <ProductGrid
      products={favorites}
      emptyTitle="Nie masz jeszcze ulubionych"
      emptyText="Kliknij serduszko przy produkcie, żeby zapisać go na tej liście. Lista jest przechowywana w tej przeglądarce."
    />
  );
}
