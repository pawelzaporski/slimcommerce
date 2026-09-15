import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton';
import { ApiError, getProduct, getProducts } from '@/lib/api';
import { formatPrice, SITE_URL } from '@/lib/site';
import type { ProductDetail } from '@/lib/types';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

// Prerenderuje strony istniejących produktów w czasie builda (SSG) - najlepsze
// pod SEO/GEO, bo boty dostają gotowy HTML bez oczekiwania na request-time SSR.
// Nowe/nieznane id i tak działają - Next dorenderuje je na żądanie (ISR).
export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ id: String(product.id) }));
}

async function loadProduct(id: string): Promise<ProductDetail> {
  try {
    return await getProduct(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await loadProduct(id);

  return {
    title: product.name,
    description: `${product.name} (SKU: ${product.sku}) — kup online w cenie ${formatPrice(product.base_price)}.`,
    alternates: { canonical: `/produkty/${product.id}` },
    openGraph: {
      title: product.name,
      description: `${product.name} — ${formatPrice(product.base_price)}`,
      url: `/produkty/${product.id}`,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await loadProduct(id);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    url: `${SITE_URL}/produkty/${product.id}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PLN',
      price: product.base_price,
      availability: product.variants.some((variant) => variant.stock > 0)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/produkty/${product.id}`,
    },
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="flex aspect-square items-center justify-center rounded-lg bg-black/5 text-black/30 dark:bg-white/10 dark:text-white/30">
        Brak zdjęcia
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">{product.sku}</p>
        <h1 className="mt-1 text-2xl font-semibold">{product.name}</h1>
        <p className="mt-3 text-xl font-semibold">{formatPrice(product.base_price)}</p>

        {product.categories.length > 0 && (
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">
            Kategorie: {product.categories.map((category) => category.name).join(', ')}
          </p>
        )}

        <div className="mt-6">
          <AddToCartButton variants={product.variants} />
        </div>
      </div>
    </div>
  );
}
