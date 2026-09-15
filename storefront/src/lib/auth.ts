import { notifyStorefrontUpdated } from './events';

const TOKEN_KEY = 'storefront_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  notifyStorefrontUpdated();
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  notifyStorefrontUpdated();
}
