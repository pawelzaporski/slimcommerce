import Image from 'next/image';
import Link from 'next/link';
import FavoriteButton from '@/components/FavoriteButton';
import PriceTag from '@/components/PriceTag';
import { imageAlt } from '@/lib/images';
import { isNewProduct } from '@/lib/site';
import type { Product } from '@/lib/types';

export default function ProductCard({ product }: { product: Product }) {
  const isNew = isNewProduct(product.created_at);
  const category = product.categories?.[0];

  return (
    <article className="group relative flex h-full flex-col">
      {isNew && (
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
          <span className="badge badge-plum">Nowość</span>
        </div>
      )}
      <FavoriteButton productId={product.id} className="absolute right-2 top-2 z-10" />

      <Link href={`/produkty/${product.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-smoke">
          {product.image1 ? (
            <Image
              src={product.image1.url}
              alt={imageAlt(product.image1, product.name)}
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 50vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-wider text-ink/30">
              Brak zdjęcia
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-1 pt-3">
          {category && <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{category.name}</p>}
          <h3 className="display mt-0.5 line-clamp-2 text-base leading-tight group-hover:text-brand">{product.name}</h3>
          <p className="mt-1 text-xs text-muted">{product.sku}</p>
          <PriceTag value={product.base_price} className="mt-auto pt-2" />
        </div>
      </Link>
    </article>
  );
}
