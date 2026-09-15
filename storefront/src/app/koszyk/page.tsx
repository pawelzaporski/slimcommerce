'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCart, removeCartItem, updateCartItem } from '@/lib/api';
import { getCartToken } from '@/lib/cart';
import { notifyStorefrontUpdated } from '@/lib/events';
import { formatPrice } from '@/lib/site';
import type { Cart } from '@/lib/types';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleQuantityChange(itemId: number, quantity: number) {
    const token = getCartToken();
    if (!token || quantity < 1) return;
    await updateCartItem(token, itemId, quantity);
    notifyStorefrontUpdated();
    setCart(await getCart(token));
  }

  async function handleRemove(itemId: number) {
    const token = getCartToken();
    if (!token) return;
    await removeCartItem(token, itemId);
    notifyStorefrontUpdated();
    setCart(await getCart(token));
  }

  if (loading) {
    return <p>Wczytywanie koszyka…</p>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Koszyk</h1>
        <p className="text-black/60 dark:text-white/60">
          Twój koszyk jest pusty.{' '}
          <Link href="/produkty" className="underline">
            Przejdź do produktów
          </Link>
          .
        </p>
      </div>
    );
  }

  const total = cart.items.reduce((sum, item) => sum + Number(item.variant.price) * item.quantity, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Koszyk</h1>
      <div className="space-y-4">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-black/10 p-4 dark:border-white/15"
          >
            <div>
              <p className="font-medium">{item.variant.sku}</p>
              <p className="text-sm text-black/60 dark:text-white/60">{formatPrice(item.variant.price)} / szt.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(event) => handleQuantityChange(item.id, Number(event.target.value))}
                className="w-20 rounded border border-black/15 bg-transparent px-2 py-1 dark:border-white/20"
              />
              <button type="button" onClick={() => handleRemove(item.id)} className="text-sm text-red-600 underline dark:text-red-400">
                Usuń
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4 dark:border-white/15">
        <span className="text-lg font-semibold">Razem</span>
        <span className="text-lg font-semibold">{formatPrice(total)}</span>
      </div>

      <Link
        href="/zamowienie"
        className="mt-6 inline-block rounded bg-black px-5 py-2.5 font-medium text-white dark:bg-white dark:text-black"
      >
        Przejdź do zamówienia
      </Link>
    </div>
  );
}
