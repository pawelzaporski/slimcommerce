'use client';

import { useState } from 'react';
import { addCartItem } from '@/lib/api';
import { ensureCartToken } from '@/lib/cart';
import { notifyStorefrontUpdated } from '@/lib/events';
import { formatPrice } from '@/lib/site';
import type { ProductVariant } from '@/lib/types';

export default function AddToCartButton({ variants }: { variants: ProductVariant[] }) {
  const [variantId, setVariantId] = useState(variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const outOfStock = !selectedVariant || selectedVariant.stock < 1;

  async function handleAddToCart() {
    if (!variantId) return;

    setStatus('loading');
    try {
      const token = await ensureCartToken();
      await addCartItem(token, variantId, quantity);
      notifyStorefrontUpdated();
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  if (variants.length === 0) {
    return <p className="text-black/60 dark:text-white/60">Ten produkt nie ma jeszcze wariantu do sprzedaży.</p>;
  }

  return (
    <div className="space-y-4">
      {variants.length > 1 && (
        <label className="block text-sm">
          Wariant
          <select
            className="mt-1 block w-full rounded border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
            value={variantId}
            onChange={(event) => setVariantId(Number(event.target.value))}
          >
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.sku} — {formatPrice(variant.price)}
                {variant.stock < 1 ? ' (brak w magazynie)' : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block text-sm">
        Ilość
        <input
          type="number"
          min={1}
          className="mt-1 block w-24 rounded border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
        />
      </label>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={outOfStock || status === 'loading'}
        className="rounded bg-black px-5 py-2.5 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {outOfStock ? 'Brak w magazynie' : status === 'loading' ? 'Dodawanie…' : 'Dodaj do koszyka'}
      </button>

      {status === 'done' && <p className="text-sm text-green-600 dark:text-green-400">Dodano do koszyka.</p>}
      {status === 'error' && <p className="text-sm text-red-600 dark:text-red-400">Nie udało się dodać do koszyka.</p>}
    </div>
  );
}
