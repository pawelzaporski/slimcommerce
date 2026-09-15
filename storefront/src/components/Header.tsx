'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCart } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getCartToken } from '@/lib/cart';
import { onStorefrontUpdated } from '@/lib/events';
import { SITE_NAME } from '@/lib/site';

export default function Header() {
  const [itemCount, setItemCount] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    function refresh() {
      setLoggedIn(Boolean(getToken()));

      const cartToken = getCartToken();
      if (!cartToken) {
        setItemCount(0);
        return;
      }

      getCart(cartToken)
        .then((cart) => setItemCount(cart.items.reduce((sum, item) => sum + item.quantity, 0)))
        .catch(() => setItemCount(0));
    }

    refresh();
    return onStorefrontUpdated(refresh);
  }, []);

  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-semibold">
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/produkty">Produkty</Link>
          <Link href="/koszyk">Koszyk{itemCount > 0 ? ` (${itemCount})` : ''}</Link>
          {loggedIn ? (
            <Link href="/konto">Moje konto</Link>
          ) : (
            <>
              <Link href="/logowanie">Zaloguj się</Link>
              <Link href="/rejestracja">Zarejestruj się</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
