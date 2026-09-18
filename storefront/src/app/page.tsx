import Link from 'next/link';
import CategoryTiles from '@/components/CategoryTiles';
import HeroBanner from '@/components/HeroBanner';
import ProductCard from '@/components/ProductCard';
import SectionHeading from '@/components/SectionHeading';
import { getCategoriesSafe, getProducts, getStorefrontSettingsSafe } from '@/lib/api';
import { buildCategoryTree } from '@/lib/categories';
import { formatPrice } from '@/lib/site';

export default async function HomePage() {
  const [products, categories, settings] = await Promise.all([getProducts(), getCategoriesSafe(), getStorefrontSettingsSafe()]);
  const freeShippingFrom = settings.free_shipping_from;

  const tree = buildCategoryTree(categories).filter((node) => node.total_count > 0);
  const newest = [...products]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);
  const featured = products.find((product) => product.image1) ?? products[0];
  const recommended = products.slice(0, 8);

  return (
    <div>
      <HeroBanner featured={featured} />

      {tree.length > 0 && (
        <section className="container-x pt-12">
          <SectionHeading title="Kupuj według kategorii" href="/produkty" linkLabel="Wszystkie produkty" />
          <CategoryTiles categories={tree} />
        </section>
      )}

      {newest.length > 0 && (
        <section className="container-x pt-14">
          <SectionHeading title="Nowości w sklepie" href="/nowosci" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {newest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section className="container-x pt-14">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col justify-between rounded-3xl bg-rose-light p-8">
            <div>
              <span className="badge badge-brand">Dostawa</span>
              {freeShippingFrom !== null ? (
                <>
                  <h2 className="display mt-3 text-3xl">
                    Darmowa dostawa
                    <br />
                    od {formatPrice(freeShippingFrom)}
                  </h2>
                  <p className="mt-3 max-w-sm text-sm text-ink/70">
                    Zamów za co najmniej {formatPrice(freeShippingFrom)}, a wysyłkę bierzemy na siebie. Paczka wychodzi w 24 h od
                    zaksięgowania płatności.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="display mt-3 text-3xl">
                    Dostawa
                    <br />
                    pod Twoje drzwi
                  </h2>
                  <p className="mt-3 max-w-sm text-sm text-ink/70">
                    Koszt dostawy zobaczysz w podsumowaniu zamówienia. Paczka wychodzi w 24 h od zaksięgowania płatności.
                  </p>
                </>
              )}
            </div>
            <Link href="/pomoc#dostawa" className="btn btn-outline mt-6 self-start">
              Zobacz więcej
            </Link>
          </div>
          <div className="flex flex-col justify-between rounded-3xl bg-lemon/60 p-8">
            <div>
              <span className="badge badge-ink">Konto</span>
              <h2 className="display mt-3 text-3xl">
                Załóż konto
                <br />i kupuj szybciej
              </h2>
              <p className="mt-3 max-w-sm text-sm text-ink/70">
                Zapamiętamy Twoje dane do wysyłki, a kolejne zamówienie złożysz w kilka kliknięć.
              </p>
            </div>
            <Link href="/rejestracja" className="btn btn-black mt-6 self-start">
              Zarejestruj się
            </Link>
          </div>
        </div>
      </section>

      <section className="container-x pt-14">
        <SectionHeading title="Polecane produkty" href="/produkty" />
        {recommended.length === 0 ? (
          <p className="text-sm text-muted">Brak produktów w ofercie.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {recommended.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
