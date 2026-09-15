import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/site';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/produkty/${product.id}`}
      className="block rounded-lg border border-black/10 p-4 transition hover:border-black/30 dark:border-white/15 dark:hover:border-white/40"
    >
      <p className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">{product.sku}</p>
      <h3 className="mt-1 font-medium">{product.name}</h3>
      <p className="mt-2 font-semibold">{formatPrice(product.base_price)}</p>
    </Link>
  );
}
