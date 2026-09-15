import { createCart } from './api';

const CART_TOKEN_KEY = 'storefront_cart_token';

export function getCartToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CART_TOKEN_KEY);
}

export function setCartToken(token: string): void {
  window.localStorage.setItem(CART_TOKEN_KEY, token);
}

/** Woła się po udanym checkout - stary token trafia do zamówienia, kolejne dodania do koszyka mają zacząć nowy. */
export function clearCartToken(): void {
  window.localStorage.removeItem(CART_TOKEN_KEY);
}

/** Zwraca token istniejącego koszyka z localStorage albo zakłada nowy. */
export async function ensureCartToken(): Promise<string> {
  const existing = getCartToken();
  if (existing) return existing;

  const cart = await createCart();
  setCartToken(cart.token);
  return cart.token;
}
