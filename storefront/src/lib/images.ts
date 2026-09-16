import type { Asset, Product, ProductDetail } from './types';

/**
 * Wszystkie zdjęcia produktu w kolejności wyświetlania: zdjęcie 1, zdjęcie 2,
 * potem galeria. Pomija puste sloty i duplikaty (ten sam asset podpięty
 * dwa razy).
 */
export function productImages(product: Product | ProductDetail): Asset[] {
  const gallery = 'gallery' in product ? product.gallery : [];
  const seen = new Set<number>();
  const images: Asset[] = [];

  for (const asset of [product.image1, product.image2, ...gallery]) {
    if (asset && !seen.has(asset.id)) {
      seen.add(asset.id);
      images.push(asset);
    }
  }

  return images;
}

export function imageAlt(asset: Asset, fallback: string): string {
  return asset.alt?.trim() || fallback;
}
