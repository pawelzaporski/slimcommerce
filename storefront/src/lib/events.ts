/** Prosty pub/sub po window, żeby Header odświeżał licznik koszyka i stan logowania
 * po akcjach wykonanych w innych komponentach (dodanie do koszyka, logowanie...). */
const EVENT_NAME = 'storefront:updated';

export function notifyStorefrontUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function onStorefrontUpdated(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}
