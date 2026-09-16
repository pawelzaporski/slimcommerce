import Link from 'next/link';
import { ArrowRightIcon } from '@/components/icons';
import type { CategoryNode } from '@/lib/categories';
import { pluralProducts } from '@/lib/site';

const TILE_COLORS = ['bg-rose', 'bg-lemon/70', 'bg-plum/15', 'bg-smoke', 'bg-brand/10', 'bg-rose-light'];

export default function CategoryTiles({ categories }: { categories: CategoryNode[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {categories.slice(0, 6).map((category, index) => (
        <Link
          key={category.id}
          href={`/kategoria/${category.slug}`}
          className={`group flex aspect-[4/3] flex-col justify-between rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${
            TILE_COLORS[index % TILE_COLORS.length]
          }`}
        >
          <span className="self-end rounded-full bg-white/70 p-1.5 text-ink transition group-hover:bg-ink group-hover:text-white">
            <ArrowRightIcon size={16} />
          </span>
          <span>
            <span className="display block text-lg leading-tight">{category.name}</span>
            <span className="text-xs text-ink/60">{pluralProducts(category.total_count)}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
