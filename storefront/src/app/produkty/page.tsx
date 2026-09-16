import type { Metadata } from 'next';
import ProductsListing from '@/components/ProductsListing';
import { getCategoriesSafe, getProducts } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Wszystkie produkty',
  description: 'Pełna lista produktów dostępnych w sklepie slimCommerce.',
};

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategoriesSafe()]);

  return (
    <ProductsListing
      title="Wszystkie produkty"
      breadcrumbs={[{ label: 'Wszystkie produkty' }]}
      products={products}
      categories={categories}
      totalCount={products.length}
    />
  );
}
