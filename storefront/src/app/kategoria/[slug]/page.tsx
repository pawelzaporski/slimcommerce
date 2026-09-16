import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductsListing from '@/components/ProductsListing';
import { ApiError, getCategories, getCategoriesSafe, getProducts } from '@/lib/api';
import { categoryPath, findCategory } from '@/lib/categories';
import type { Product } from '@/lib/types';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    return categories.map((category) => ({ slug: category.slug }));
  } catch {
    return [];
  }
}

async function loadCategoryProducts(slug: string): Promise<Product[]> {
  try {
    return await getProducts(60, slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategoriesSafe();
  const category = findCategory(categories, slug);

  if (!category) {
    return { title: 'Kategoria' };
  }

  return {
    title: category.name,
    description: `Produkty z kategorii ${category.name} w sklepie slimCommerce.`,
    alternates: { canonical: `/kategoria/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [products, categories] = await Promise.all([loadCategoryProducts(slug), getCategoriesSafe()]);
  const category = findCategory(categories, slug);

  if (!category) {
    notFound();
  }

  const path = categoryPath(categories, slug);
  const totalCount = categories.reduce((sum, item) => sum + (item.products_count ?? 0), 0);

  return (
    <ProductsListing
      title={category.name}
      breadcrumbs={[
        { label: 'Wszystkie produkty', href: '/produkty' },
        ...path.map((item) => ({ label: item.name, href: `/kategoria/${item.slug}` })),
      ]}
      products={products}
      categories={categories}
      activeSlug={slug}
      totalCount={totalCount}
    />
  );
}
