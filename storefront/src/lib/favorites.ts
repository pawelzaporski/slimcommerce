/** Ulubione (schowek) trzymane lokalnie w przeglądarce - bez wsparcia w API. */
const FAVORITES_KEY = 'storefront_favorites';
const EVENT_NAME = 'storefront:favorites';

export function getFavoriteIds(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === 'number') : [];
  } catch {
    return [];
  }
}

export function isFavorite(productId: number): boolean {
  return getFavoriteIds().includes(productId);
}

/** Zwraca nowy stan (true = dodano do ulubionych). */
export function toggleFavorite(productId: number): boolean {
  const ids = getFavoriteIds();
  const next = ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId];
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {
    // brak localStorage (tryb prywatny) - ulubione po prostu nie zapiszą się
  }
  window.dispatchEvent(new Event(EVENT_NAME));
  return next.includes(productId);
}

export function onFavoritesChanged(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener('storage', callback);
  };
}
