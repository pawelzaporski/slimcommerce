import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/api';

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">Witaj w sklepie slimCommerce</h1>
        <p className="mt-2 text-black/60 dark:text-white/60">
          Przeglądaj naszą ofertę i zamawiaj online.{' '}
          <Link href="/produkty" className="underline">
            Zobacz wszystkie produkty
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Polecane produkty</h2>
        {products.length === 0 ? (
          <p className="text-black/60 dark:text-white/60">Brak produktów w ofercie.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
