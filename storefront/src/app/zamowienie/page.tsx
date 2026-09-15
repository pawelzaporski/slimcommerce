'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, checkout, getCart, getMe, getPaymentMethods, getShippingMethods } from '@/lib/api';
import { getToken, setToken } from '@/lib/auth';
import { clearCartToken, getCartToken } from '@/lib/cart';
import { notifyStorefrontUpdated } from '@/lib/events';
import { formatPrice } from '@/lib/site';
import type { AddressInput, Cart, CheckoutResponse, PaymentMethod, ShippingMethod } from '@/lib/types';

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

  const itemsTotal =
    cart?.items.reduce((sum, item) => sum + Number(item.variant.price) * item.quantity, 0) ?? 0;
  const shippingCost = shippingMethods.find((method) => method.id === shippingMethodId)?.flat_rate ?? 0;
  const grandTotal = itemsTotal + Number(shippingCost);

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

  if (result) {
    const { order } = result;
    return (
      <div className="max-w-lg">
        <h1 className="mb-2 text-2xl font-semibold">Dziękujemy za zamówienie!</h1>
        <p className="text-black/60 dark:text-white/60">
          Numer zamówienia: <strong>#{order.id}</strong> · status: {order.status}
        </p>

        <ul className="mt-6 space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.variant.sku} × {item.quantity}
              </span>
              <span>{formatPrice(Number(item.unit_price) * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-between border-t border-black/10 pt-4 text-lg font-semibold dark:border-white/15">
          <span>Razem</span>
          <span>{formatPrice(order.total_amount)}</span>
        </div>

        <Link href="/produkty" className="mt-6 inline-block underline">
          Wróć do sklepu
        </Link>
      </div>
    );
  }

  if (loadingCart) {
    return <p>Wczytywanie…</p>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Zamówienie</h1>
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

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h1 className="text-2xl font-semibold">Zamówienie</h1>

        {errors.form && <p className="text-sm text-red-600 dark:text-red-400">{errors.form}</p>}

        {loggedInEmail ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            Zamawiasz jako <strong>{loggedInEmail}</strong>.
          </p>
        ) : (
          <fieldset className="space-y-3">
            <legend className="mb-1 font-medium">Dane kontaktowe</legend>
            <Field label="E-mail" value={email} onChange={setEmail} type="email" error={errors.email} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Imię" value={firstName} onChange={setFirstName} error={errors.first_name} />
              <Field label="Nazwisko" value={lastName} onChange={setLastName} error={errors.last_name} />
            </div>
          </fieldset>
        )}

        <fieldset className="space-y-3">
          <legend className="mb-1 font-medium">Adres dostawy</legend>
          <AddressFields
            value={delivery}
            onChange={setDelivery}
            errors={errors}
            prefix="delivery_address"
          />
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={billingDifferent}
            onChange={(event) => setBillingDifferent(event.target.checked)}
          />
          Inny adres rozliczeniowy
        </label>

        {billingDifferent && (
          <fieldset className="space-y-3">
            <legend className="mb-1 font-medium">Adres rozliczeniowy</legend>
            <AddressFields value={billing} onChange={setBilling} errors={errors} prefix="billing_address" />
          </fieldset>
        )}

        {shippingMethods.length > 0 && (
          <label className="block text-sm">
            Dostawa
            <select
              className="mt-1 block w-full rounded border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
              value={shippingMethodId ?? ''}
              onChange={(event) => setShippingMethodId(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Brak / do ustalenia</option>
              {shippingMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name} — {formatPrice(method.flat_rate)}
                </option>
              ))}
            </select>
          </label>
        )}

        {paymentMethods.length > 0 && (
          <label className="block text-sm">
            Płatność
            <select
              className="mt-1 block w-full rounded border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
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
          </label>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-black px-5 py-2.5 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {submitting ? 'Składanie zamówienia…' : 'Złóż zamówienie'}
        </button>
      </form>

      <aside className="h-fit rounded-lg border border-black/10 p-4 dark:border-white/15">
        <h2 className="mb-3 font-medium">Podsumowanie</h2>
        <ul className="space-y-2 text-sm">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.variant.sku} × {item.quantity}
              </span>
              <span>{formatPrice(Number(item.variant.price) * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-black/10 pt-3 text-sm dark:border-white/15">
          <span>Dostawa</span>
          <span>{formatPrice(shippingCost)}</span>
        </div>
        <div className="mt-2 flex justify-between text-lg font-semibold">
          <span>Razem</span>
          <span>{formatPrice(grandTotal)}</span>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        type={type}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full rounded border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
      />
      {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
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
        error={errors[`${prefix}.street`]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Kod pocztowy"
          value={value.postal_code}
          onChange={(postal_code) => onChange({ ...value, postal_code })}
          error={errors[`${prefix}.postal_code`]}
        />
        <Field
          label="Miasto"
          value={value.city}
          onChange={(city) => onChange({ ...value, city })}
          error={errors[`${prefix}.city`]}
        />
      </div>
      <Field
        label="Kraj"
        value={value.country}
        onChange={(country) => onChange({ ...value, country })}
        error={errors[`${prefix}.country`]}
      />
    </>
  );
}
