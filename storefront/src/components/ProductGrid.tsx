'use client';

import { useMemo, useState } from 'react';
import EmptyState from '@/components/EmptyState';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/types';

type SortKey = 'default' | 'newest' | 'price-asc' | 'price-desc' | 'name';

const SORT_LABELS: Record<SortKey, string> = {
  default: 'Domyślnie',
  newest: 'Najnowsze',
  'price-asc': 'Cena: od najniższej',
  'price-desc': 'Cena: od najwyższej',
  name: 'Nazwa A–Z',
};

interface ProductGridProps {
  products: Product[];
  showToolbar?: boolean;
  emptyTitle?: string;
  emptyText?: string;
  columns?: 3 | 4;
}

function sortProducts(products: Product[], sort: SortKey): Product[] {
  const copy = [...products];
  switch (sort) {
    case 'newest':
      return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'price-asc':
      return copy.sort((a, b) => Number(a.base_price) - Number(b.base_price));
    case 'price-desc':
      return copy.sort((a, b) => Number(b.base_price) - Number(a.base_price));
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
    default:
      return copy;
  }
}

export default function ProductGrid({
  products,
  showToolbar = true,
  emptyTitle = 'Brak produktów',
  emptyText = 'W tej kategorii nie ma jeszcze żadnych produktów.',
  columns = 4,
}: ProductGridProps) {
  const [sort, setSort] = useState<SortKey>('default');
  const sorted = useMemo(() => sortProducts(products, sort), [products, sort]);

  if (products.length === 0) {
    return <EmptyState title={emptyTitle} text={emptyText} />;
  }

  const gridClass =
    columns === 3
      ? 'grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3'
      : 'grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div>
      {showToolbar && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
          <p className="text-sm text-ink/80">
            Liczba produktów: <strong>{products.length}</strong>
          </p>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Sortuj</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="field w-auto rounded-full py-2 pl-4 pr-9"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className={gridClass}>
        {sorted.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
