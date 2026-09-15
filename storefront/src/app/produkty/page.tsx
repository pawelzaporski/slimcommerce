import type { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Produkty',
  description: 'Pełna lista produktów dostępnych w sklepie slimCommerce.',
};

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Produkty</h1>
      {products.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">Brak produktów w ofercie.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
