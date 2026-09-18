'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import PriceTag from '@/components/PriceTag';
import { CheckIcon } from '@/components/icons';
import { ApiError, checkout, getCart, getMe, getPaymentMethods, getShippingMethods } from '@/lib/api';
import { getToken, setToken } from '@/lib/auth';
import { clearCartToken, getCartToken } from '@/lib/cart';
import { describeDiscount } from '@/lib/discounts';
import { notifyStorefrontUpdated } from '@/lib/events';
import { imageAlt } from '@/lib/images';
import { formatPrice } from '@/lib/site';
import type { AddressInput, Cart, CheckoutResponse, OrderItem, PaymentMethod, ShippingMethod } from '@/lib/types';

const emptyAddress: AddressInput = { street: '', city: '', postal_code: '', country: 'PL' };

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [delivery, setDelivery] = useState<AddressInput>(emptyAddress);
  const [billingDifferent, setBillingDifferent] = useState(false);
  const [billing, setBilling] = useState<AddressInput>(emptyAddress);
  const [shippingMethodId, setShippingMethodId] = useState<number | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckoutResponse | null>(null);

  useEffect(() => {
    async function load() {
      const cartToken = getCartToken();
      if (cartToken) {
        try {
          setCart(await getCart(cartToken));
        } catch {
          setCart(null);
        }
      }
      setLoadingCart(false);

      try {
        setShippingMethods(await getShippingMethods());
      } catch {
        setShippingMethods([]);
      }

      try {
        setPaymentMethods(await getPaymentMethods());
      } catch {
        setPaymentMethods([]);
      }

      const clientToken = getToken();
      if (clientToken) {
        try {
          const client = await getMe(clientToken);
          setLoggedInEmail(client.email);
        } catch {
          setLoggedInEmail(null);
        }
      }
    }

    load();
  }, []);

  // Wycena produktów i rabatu przychodzi z API razem z koszykiem (to samo liczy
  // checkout po stronie serwera); tu dokładamy tylko koszt wybranej dostawy,
  // chyba że koszyk ma darmową dostawę (kod albo próg miejsca sprzedaży).
  const pricing = cart?.pricing ?? null;
  const itemsTotal = pricing?.items_total ?? 0;
  const discountAmount = pricing?.discount_amount ?? 0;
  const selectedShipping = shippingMethods.find((method) => method.id === shippingMethodId);
  const shippingCost = pricing?.free_shipping ? 0 : Number(selectedShipping?.flat_rate ?? 0);
  const grandTotal = (pricing?.subtotal ?? 0) + shippingCost;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!cart) return;

    setErrors({});
    setSubmitting(true);

    try {
      const clientToken = loggedInEmail ? (getToken() ?? undefined) : undefined;
      const paymentMethodName = paymentMethods.find((method) => method.id === paymentMethodId)?.name;
      const response = await checkout(
        {
          cart_token: cart.token,
          ...(loggedInEmail ? {} : { email, first_name: firstName, last_name: lastName }),
          delivery_address: delivery,
          ...(billingDifferent ? { billing_address: billing } : {}),
          shipping_method_id: shippingMethodId,
          ...(paymentMethodName ? { payment_method: paymentMethodName } : {}),
        },
        clientToken,
      );

      clearCartToken();
      setToken(response.token);
      notifyStorefrontUpdated();
      setResult(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? { form: err.message });
      } else {
        setErrors({ form: 'Wystąpił błąd, spróbuj ponownie.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const heading = (
    <>
      <Breadcrumbs items={[{ label: 'Koszyk', href: '/koszyk' }, { label: 'Zamówienie' }]} />
      <h1 className="display mb-6 mt-3 text-3xl md:text-4xl">Zamówienie</h1>
    </>
  );

  if (result) {
    const { order } = result;
    return (
      <div className="container-x py-10">
        <div className="mx-auto max-w-xl">
          <div className="card p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-light text-brand">
              <CheckIcon size={28} />
            </span>
            <h1 className="display mt-4 text-3xl md:text-4xl">Dziękujemy za zamówienie!</h1>
            <p className="mt-2 text-sm text-muted">
              Numer zamówienia: <strong className="text-ink">#{order.id}</strong> · status: {order.status}
            </p>

            <ul className="mt-8 space-y-3 text-left text-sm">
              {order.items.map((item) => (
                <OrderLine key={item.id} item={item} amount={Number(item.unit_price) * item.quantity} />
              ))}
            </ul>

            <dl className="mt-5 space-y-1 border-t border-black/10 pt-4 text-left text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Produkty</dt>
                <dd className="font-semibold">{formatPrice(order.items_amount)}</dd>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-brand">
                  <dt>Rabat{order.discount_code ? ` (${order.discount_code})` : ''}</dt>
                  <dd className="font-semibold">-{formatPrice(order.discount_amount)}</dd>
                </div>
              )}
              {order.shipping_method && (
                <div className="flex justify-between">
                  <dt className="text-muted">Dostawa ({order.shipping_method.name})</dt>
                  <dd className="font-semibold">{Number(order.shipping_amount) > 0 ? formatPrice(order.shipping_amount) : 'gratis'}</dd>
                </div>
              )}
            </dl>

            <div className="mt-4 flex items-end justify-between border-t border-black/10 pt-4">
              <span className="display text-lg">Razem</span>
              <PriceTag value={order.total_amount} />
            </div>

            <Link href="/produkty" className="btn btn-brand mt-8">
              Wróć do sklepu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loadingCart) {
    return (
      <div className="container-x py-6 md:py-8">
        {heading}
        <p className="text-sm text-muted">Wczytywanie…</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-x py-6 md:py-8">
        {heading}
        <EmptyState title="Twój koszyk jest pusty" text="Dodaj produkty do koszyka, żeby złożyć zamówienie." />
      </div>
    );
  }

  return (
    <div className="container-x py-6 md:py-8">
      {heading}

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_24rem]">
        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
          {errors.form && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{errors.form}</p>
          )}
          {errors.discount_code && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Kod rabatowy: {errors.discount_code}{' '}
              <Link href="/koszyk" className="underline">
                Wróć do koszyka
              </Link>
            </p>
          )}

          <section className="card p-6">
            <h2 className="display text-xl">1. Dane kontaktowe</h2>
            {loggedInEmail ? (
              <p className="mt-3 text-sm text-ink/80">
                Zamawiasz jako <strong>{loggedInEmail}</strong>.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <Field label="E-mail" value={email} onChange={setEmail} type="email" autoComplete="email" error={errors.email} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Imię" value={firstName} onChange={setFirstName} autoComplete="given-name" error={errors.first_name} />
                  <Field label="Nazwisko" value={lastName} onChange={setLastName} autoComplete="family-name" error={errors.last_name} />
                </div>
                <p className="text-xs text-muted">
                  Masz konto?{' '}
                  <Link href="/logowanie" className="font-semibold text-brand underline">
                    Zaloguj się
                  </Link>
                  , a dane uzupełnimy za Ciebie.
                </p>
              </div>
            )}
          </section>

          <section className="card p-6">
            <h2 className="display text-xl">2. Adres dostawy</h2>
            <div className="mt-4 space-y-4">
              <AddressFields value={delivery} onChange={setDelivery} errors={errors} prefix="delivery_address" />
            </div>

            <label className="mt-5 flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={billingDifferent}
                onChange={(event) => setBillingDifferent(event.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              Inny adres rozliczeniowy
            </label>

            {billingDifferent && (
              <div className="mt-4 space-y-4 border-t border-black/10 pt-4">
                <AddressFields value={billing} onChange={setBilling} errors={errors} prefix="billing_address" />
              </div>
            )}
          </section>

          <section className="card p-6">
            <h2 className="display text-xl">3. Dostawa i płatność</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="shipping" className="field-label">
                  Dostawa
                </label>
                <select
                  id="shipping"
                  className="field"
                  value={shippingMethodId ?? ''}
                  onChange={(event) => setShippingMethodId(event.target.value ? Number(event.target.value) : null)}
                >
                  <option value="">Brak / do ustalenia</option>
                  {shippingMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name} — {pricing?.free_shipping ? 'gratis' : formatPrice(method.flat_rate)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="payment" className="field-label">
                  Płatność
                </label>
                <select
                  id="payment"
                  className="field"
                  value={paymentMethodId ?? ''}
                  onChange={(event) => setPaymentMethodId(event.target.value ? Number(event.target.value) : null)}
                >
                  <option value="">Do ustalenia</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <button type="submit" disabled={submitting} className="btn btn-brand btn-lg w-full lg:hidden">
            {submitting ? 'Składanie zamówienia…' : 'Złóż zamówienie'}
          </button>
        </form>

        <aside className="card sticky top-4 p-6">
          <h2 className="display text-xl">Podsumowanie</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {cart.items.map((item) => (
              <OrderLine key={item.id} item={item} amount={Number(item.variant.price) * item.quantity} />
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-black/10 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Produkty</dt>
              <dd className="font-semibold">{formatPrice(itemsTotal)}</dd>
            </div>
            {cart.discount_code && discountAmount > 0 && (
              <div className="flex justify-between text-brand">
                <dt>
                  Rabat ({cart.discount_code.code})
                  <span className="block text-[11px] font-normal text-muted">{describeDiscount(cart.discount_code)}</span>
                </dt>
                <dd className="font-semibold">-{formatPrice(discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Dostawa</dt>
              <dd className="font-semibold">
                {pricing?.free_shipping ? 'gratis' : selectedShipping ? formatPrice(shippingCost) : 'do ustalenia'}
              </dd>
            </div>
          </dl>
          {cart.discount_code?.type === 'free_shipping' && (
            <p className="mt-2 text-xs text-muted">Kod {cart.discount_code.code}: darmowa dostawa.</p>
          )}
          <div className="mt-4 flex items-end justify-between border-t border-black/10 pt-4">
            <span className="display text-lg">Razem</span>
            <PriceTag value={grandTotal} />
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className="btn btn-brand btn-lg mt-5 hidden w-full lg:inline-flex"
          >
            {submitting ? 'Składanie zamówienia…' : 'Złóż zamówienie'}
          </button>
          <p className="mt-3 text-center text-[11px] text-muted">
            Składając zamówienie akceptujesz{' '}
            <Link href="/regulamin" className="underline">
              regulamin
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}

function OrderLine({
  item,
  amount,
}: {
  item: { id: number; quantity: number; variant: OrderItem['variant'] };
  amount: number;
}) {
  const product = item.variant.product;
  return (
    <li className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-12 w-12 flex-none overflow-hidden rounded-lg bg-smoke">
          {product?.image1 && (
            <Image src={product.image1.url} alt={imageAlt(product.image1, product.name)} fill sizes="48px" className="object-cover" />
          )}
        </div>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{product?.name ?? item.variant.sku}</span>
          <span className="text-xs text-muted">× {item.quantity}</span>
        </span>
      </div>
      <span className="whitespace-nowrap font-semibold">{formatPrice(amount)}</span>
    </li>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        type={type}
        required
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="field"
      />
      {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}

function AddressFields({
  value,
  onChange,
  errors,
  prefix,
}: {
  value: AddressInput;
  onChange: (value: AddressInput) => void;
  errors: Record<string, string>;
  prefix: string;
}) {
  return (
    <>
      <Field
        label="Ulica i numer"
        value={value.street}
        onChange={(street) => onChange({ ...value, street })}
        autoComplete="street-address"
        error={errors[`${prefix}.street`]}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Kod pocztowy"
          value={value.postal_code}
          onChange={(postal_code) => onChange({ ...value, postal_code })}
          autoComplete="postal-code"
          error={errors[`${prefix}.postal_code`]}
        />
        <Field
          label="Miasto"
          value={value.city}
          onChange={(city) => onChange({ ...value, city })}
          autoComplete="address-level2"
          error={errors[`${prefix}.city`]}
        />
      </div>
      <Field
        label="Kraj"
        value={value.country}
        onChange={(country) => onChange({ ...value, country })}
        autoComplete="country"
        error={errors[`${prefix}.country`]}
      />
    </>
  );
}
