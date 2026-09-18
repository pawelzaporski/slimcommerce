import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton';
import Breadcrumbs from '@/components/Breadcrumbs';
import FavoriteButton from '@/components/FavoriteButton';
import PriceTag from '@/components/PriceTag';
import ProductCard from '@/components/ProductCard';
import ProductGallery from '@/components/ProductGallery';
import SectionHeading from '@/components/SectionHeading';
import { ReturnIcon, ShieldIcon, TruckIcon } from '@/components/icons';
import { ApiError, getProduct, getProducts, getStorefrontSettingsSafe } from '@/lib/api';
import { imageAlt, productImages } from '@/lib/images';
import { formatPrice, isNewProduct, SITE_URL } from '@/lib/site';
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
  const images = productImages(product);

  return {
    title: product.name,
    description: `${product.name} (SKU: ${product.sku}) — kup online w cenie ${formatPrice(product.base_price)}.`,
    alternates: { canonical: `/produkty/${product.id}` },
    openGraph: {
      title: product.name,
      description: `${product.name} — ${formatPrice(product.base_price)}`,
      url: `/produkty/${product.id}`,
      images: images.map((image) => ({
        url: image.url,
        width: image.width ?? undefined,
        height: image.height ?? undefined,
        alt: imageAlt(image, product.name),
      })),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await loadProduct(id);
  const images = productImages(product);
  const mainCategory = product.categories[0];

  // "Podobne produkty": najpierw z tych samych kategorii, a gdy ich za mało - dopełniamy innymi z oferty.
  const allProducts = await getProducts().catch(() => []);
  const { free_shipping_from: freeShippingFrom } = await getStorefrontSettingsSafe();
  const categoryIds = new Set(product.categories.map((category) => category.id));
  const others = allProducts.filter((item) => item.id !== product.id);
  const related = others.filter((item) => (item.categories ?? []).some((category) => categoryIds.has(category.id)));
  const fallbackRelated = [...related, ...others.filter((item) => !related.includes(item))].slice(0, 4);

  const inStock = product.variants.some((variant) => variant.stock > 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    url: `${SITE_URL}/produkty/${product.id}`,
    ...(images.length > 0 ? { image: images.map((image) => image.url) } : {}),
    ...(mainCategory ? { category: mainCategory.name } : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PLN',
      price: product.base_price,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/produkty/${product.id}`,
    },
  };

  return (
    <div className="container-x py-6 md:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumbs
        items={[
          { label: 'Wszystkie produkty', href: '/produkty' },
          ...(mainCategory ? [{ label: mainCategory.name, href: `/kategoria/${mainCategory.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-10 md:grid-cols-2 lg:gap-16">
        <div className="relative">
          {isNewProduct(product.created_at) && <span className="badge badge-plum absolute left-3 top-3 z-10">Nowość</span>}
          <ProductGallery images={images} productName={product.name} />
        </div>

        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              {mainCategory && (
                <Link
                  href={`/kategoria/${mainCategory.slug}`}
                  className="text-xs font-semibold uppercase tracking-wider text-muted hover:text-brand"
                >
                  {mainCategory.name}
                </Link>
              )}
              <h1 className="display mt-1 text-3xl leading-tight md:text-5xl">{product.name}</h1>
              <p className="mt-2 text-xs text-muted">SKU: {product.sku}</p>
            </div>
            <FavoriteButton productId={product.id} size={22} className="mt-1 h-11 w-11 shrink-0" />
          </div>

          <PriceTag value={product.base_price} size="lg" className="mt-6" />
          <p className="mt-1 text-xs text-muted">Cena brutto, zawiera VAT.</p>

          <div className="mt-8">
            <AddToCartButton variants={product.variants} />
          </div>

          <div className="mt-8 rounded-2xl bg-rose-light p-5">
            <p className="display text-sm">Kupując u nas</p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li className="flex items-center gap-3">
                <TruckIcon size={20} className="shrink-0 text-brand" />
                <span>
                  {freeShippingFrom !== null ? (
                    <>
                      <strong>Darmowa dostawa</strong> od {formatPrice(freeShippingFrom)}
                    </>
                  ) : (
                    <strong>Dostawa pod wskazany adres</strong>
                  )}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <ReturnIcon size={20} className="shrink-0 text-brand" />
                <span>
                  <strong>14 dni na zwrot</strong> bez podawania przyczyny
                </span>
              </li>
              <li className="flex items-center gap-3">
                <ShieldIcon size={20} className="shrink-0 text-brand" />
                <span>
                  <strong>Bezpieczne płatności</strong> — BLIK, karta, przelew
                </span>
              </li>
            </ul>
          </div>

          {product.categories.length > 1 && (
            <p className="mt-6 text-sm text-muted">
              Kategorie:{' '}
              {product.categories.map((category, index) => (
                <span key={category.id}>
                  {index > 0 && ', '}
                  <Link href={`/kategoria/${category.slug}`} className="underline hover:text-brand">
                    {category.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      {fallbackRelated.length > 0 && (
        <section className="mt-16">
          <SectionHeading
            title={related.length > 0 ? 'Podobne produkty' : 'Może Ci się spodobać'}
            href={mainCategory ? `/kategoria/${mainCategory.slug}` : '/produkty'}
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {fallbackRelated.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
