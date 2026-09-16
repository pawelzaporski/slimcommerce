import type { MetadataRoute } from 'next';
import { getCategoriesSafe, getProducts } from '@/lib/api';
import { SITE_URL } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategoriesSafe()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/produkty`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/nowosci`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/o-nas`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/kontakt`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/pomoc`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/regulamin`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/polityka-prywatnosci`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/kategoria/${category.slug}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/produkty/${product.id}`,
    lastModified: product.updated_at,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
