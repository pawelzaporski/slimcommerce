export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
export const SITE_NAME = 'slimCommerce';
export const SITE_TAGLINE = 'zakupy z przyjemnością';
export const FREE_SHIPPING_FROM = 99;
export const NEW_PRODUCT_DAYS = 30;

export function formatPrice(value: string | number): string {
  const amount = typeof value === 'string' ? Number.parseFloat(value) : value;
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount);
}

/** "39.99" -> { zl: "39", gr: "99" } - pod duży zapis ceny z groszami w indeksie górnym. */
export function splitPrice(value: string | number): { zl: string; gr: string } {
  const amount = typeof value === 'string' ? Number.parseFloat(value) : value;
  const safe = Number.isFinite(amount) ? amount : 0;
  const zl = Math.floor(safe);
  const gr = Math.round((safe - zl) * 100);
  return { zl: zl.toLocaleString('pl-PL'), gr: String(gr).padStart(2, '0') };
}

export function isNewProduct(createdAt: string, days = NEW_PRODUCT_DAYS): boolean {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  return Date.now() - created < days * 24 * 60 * 60 * 1000;
}

/** Odmiana rzeczownika "produkt" po liczbie: 1 produkt, 2-4 produkty, 5+ produktów (z regułą dla 12-14, 22-24...). */
export function pluralProducts(count: number): string {
  const abs = Math.abs(count);
  const lastTwo = abs % 100;
  const last = abs % 10;
  if (abs === 1) return `${count} produkt`;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${count} produkty`;
  return `${count} produktów`;
}
