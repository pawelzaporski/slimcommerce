'use client';

import { useState } from 'react';
import { CheckIcon, MinusIcon, PlusIcon } from '@/components/icons';
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
    return <p className="text-sm text-muted">Ten produkt nie ma jeszcze wariantu do sprzedaży.</p>;
  }

  const stepperButton =
    'inline-flex h-12 w-12 items-center justify-center text-ink transition hover:bg-smoke disabled:opacity-40';

  return (
    <div className="space-y-5">
      {variants.length > 1 && (
        <div>
          <label htmlFor="variant" className="field-label">
            Wariant
          </label>
          <select
            id="variant"
            className="field"
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
        </div>
      )}

      <p className={`flex items-center gap-2 text-sm font-semibold ${outOfStock ? 'text-red-600' : 'text-green-700'}`}>
        <span className={`inline-block h-2 w-2 rounded-full ${outOfStock ? 'bg-red-600' : 'bg-green-600'}`} />
        {outOfStock ? 'Chwilowo niedostępny' : 'Dostępny — wysyłka w 24 h'}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-black/15" role="group" aria-label="Ilość">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            className={`${stepperButton} rounded-l-full`}
            aria-label="Zmniejsz ilość"
          >
            <MinusIcon size={16} />
          </button>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            className="w-12 border-x border-black/15 bg-transparent py-3 text-center text-sm font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label="Ilość"
          />
          <button
            type="button"
            onClick={() => setQuantity((value) => value + 1)}
            className={`${stepperButton} rounded-r-full`}
            aria-label="Zwiększ ilość"
          >
            <PlusIcon size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock || status === 'loading'}
          className="btn btn-brand btn-lg flex-1 sm:flex-none sm:min-w-56"
        >
          {outOfStock ? 'Brak w magazynie' : status === 'loading' ? 'Dodawanie…' : 'Dodaj do koszyka'}
        </button>
      </div>

      {status === 'done' && (
        <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
          <CheckIcon size={18} /> Dodano do koszyka.
        </p>
      )}
      {status === 'error' && <p className="text-sm font-semibold text-red-600">Nie udało się dodać do koszyka.</p>}
    </div>
  );
}
