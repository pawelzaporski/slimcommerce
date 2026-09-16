'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import PriceTag from '@/components/PriceTag';
import { MinusIcon, PlusIcon, TruckIcon } from '@/components/icons';
import { getCart, removeCartItem, updateCartItem } from '@/lib/api';
import { getCartToken } from '@/lib/cart';
import { notifyStorefrontUpdated } from '@/lib/events';
import { imageAlt } from '@/lib/images';
import { FREE_SHIPPING_FROM, formatPrice } from '@/lib/site';
import type { Cart } from '@/lib/types';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const token = getCartToken();
      if (!token) {
        setCart(null);
        setLoading(false);
        return;
      }

      try {
        setCart(await getCart(token));
      } catch {
        setCart(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleQuantityChange(itemId: number, quantity: number) {
    const token = getCartToken();
    if (!token || quantity < 1) return;
    setBusyItemId(itemId);
    try {
      await updateCartItem(token, itemId, quantity);
      notifyStorefrontUpdated();
      setCart(await getCart(token));
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleRemove(itemId: number) {
    const token = getCartToken();
    if (!token) return;
    setBusyItemId(itemId);
    try {
      await removeCartItem(token, itemId);
      notifyStorefrontUpdated();
      setCart(await getCart(token));
    } finally {
      setBusyItemId(null);
    }
  }

  const heading = (
    <>
      <Breadcrumbs items={[{ label: 'Koszyk' }]} />
      <h1 className="display mb-6 mt-3 text-3xl md:text-4xl">Koszyk</h1>
    </>
  );

  if (loading) {
    return (
      <div className="container-x py-6 md:py-8">
        {heading}
        <p className="text-sm text-muted">Wczytywanie koszyka…</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-x py-6 md:py-8">
        {heading}
        <EmptyState title="Twój koszyk jest pusty" text="Dodaj coś do koszyka, a pojawi się tutaj." />
      </div>
    );
  }

  const total = cart.items.reduce((sum, item) => sum + Number(item.variant.price) * item.quantity, 0);
  const missingForFreeShipping = Math.max(0, FREE_SHIPPING_FROM - total);
  const stepperButton = 'inline-flex h-9 w-9 items-center justify-center text-ink transition hover:bg-smoke disabled:opacity-40';

  return (
    <div className="container-x py-6 md:py-8">
      {heading}

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
        <ul className="space-y-3">
          {cart.items.map((item) => {
            const product = item.variant.product;
            const busy = busyItemId === item.id;
            return (
              <li key={item.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <Link
                  href={product ? `/produkty/${product.id}` : '#'}
                  className="relative h-24 w-24 flex-none overflow-hidden rounded-xl bg-smoke"
                >
                  {product?.image1 ? (
                    <Image
                      src={product.image1.url}
                      alt={imageAlt(product.image1, product.name)}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] uppercase tracking-wider text-ink/30">
                      Brak zdjęcia
                    </span>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  {product?.categories?.[0] && (
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{product.categories[0].name}</p>
                  )}
                  <Link href={product ? `/produkty/${product.id}` : '#'} className="display block text-lg leading-tight hover:text-brand">
                    {product?.name ?? item.variant.sku}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">
                    {item.variant.sku} · {formatPrice(item.variant.price)} / szt.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="flex items-center rounded-full border border-black/15" role="group" aria-label="Ilość">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={busy || item.quantity <= 1}
                      className={`${stepperButton} rounded-l-full`}
                      aria-label="Zmniejsz ilość"
                    >
                      <MinusIcon size={14} />
                    </button>
                    <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={busy}
                      className={`${stepperButton} rounded-r-full`}
                      aria-label="Zwiększ ilość"
                    >
                      <PlusIcon size={14} />
                    </button>
                  </div>

                  <div className="w-28 text-right">
                    <PriceTag value={Number(item.variant.price) * item.quantity} size="sm" />
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={busy}
                      className="mt-1 text-xs text-muted underline hover:text-brand disabled:opacity-50"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="card sticky top-4 p-6">
          <h2 className="display text-xl">Podsumowanie</h2>

          <div className="mt-4 rounded-xl bg-rose-light p-3 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              <TruckIcon size={18} className="text-brand" />
              {missingForFreeShipping > 0
                ? `Brakuje ${formatPrice(missingForFreeShipping)} do darmowej dostawy`
                : 'Masz darmową dostawę!'}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${Math.min(100, (total / FREE_SHIPPING_FROM) * 100)}%` }}
              />
            </div>
          </div>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Wartość produktów</dt>
              <dd className="font-semibold">{formatPrice(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Dostawa</dt>
              <dd className="font-semibold">{missingForFreeShipping > 0 ? 'wg wybranej metody' : 'gratis'}</dd>
            </div>
          </dl>

          <div className="mt-4 flex items-end justify-between border-t border-black/10 pt-4">
            <span className="display text-lg">Razem</span>
            <PriceTag value={total} />
          </div>

          <Link href="/zamowienie" className="btn btn-brand btn-lg mt-5 w-full">
            Przejdź do zamówienia
          </Link>
          <Link href="/produkty" className="mt-3 block text-center text-xs font-semibold text-muted underline hover:text-brand">
            Kontynuuj zakupy
          </Link>
        </aside>
      </div>
    </div>
  );
}
