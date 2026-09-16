import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductGrid from '@/components/ProductGrid';
import { getProducts } from '@/lib/api';
import { NEW_PRODUCT_DAYS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Nowości',
  description: 'Najnowsze produkty w ofercie sklepu slimCommerce.',
};

const LIMIT = 24;

export default async function NewProductsPage() {
  const products = await getProducts();
  const newest = [...products]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, LIMIT);

  return (
    <div className="container-x py-6 md:py-8">
      <Breadcrumbs items={[{ label: 'Nowości' }]} />
      <h1 className="display mb-2 mt-3 text-3xl md:text-4xl">Nowości</h1>
      <p className="mb-8 max-w-2xl text-sm text-ink/70">
        Ostatnio dodane produkty. Etykietę „Nowość” noszą przez {NEW_PRODUCT_DAYS} dni od pojawienia się w ofercie.
      </p>
      <ProductGrid products={newest} emptyTitle="Brak nowości" emptyText="Wkrótce pojawią się tu nowe produkty." />
    </div>
  );
}
