import Breadcrumbs, { type Crumb } from '@/components/Breadcrumbs';
import CategorySidebar from '@/components/CategorySidebar';
import ProductGrid from '@/components/ProductGrid';
import { buildCategoryTree } from '@/lib/categories';
import type { Category, Product } from '@/lib/types';

interface ProductsListingProps {
  title: string;
  description?: string;
  breadcrumbs: Crumb[];
  products: Product[];
  categories: Category[];
  activeSlug?: string;
  totalCount: number;
}

/** Wspólny układ listingu (wszystkie produkty / kategoria): okruszki, tytuł, boczne kategorie, siatka. */
export default function ProductsListing({
  title,
  description,
  breadcrumbs,
  products,
  categories,
  activeSlug,
  totalCount,
}: ProductsListingProps) {
  const tree = buildCategoryTree(categories);

  return (
    <div className="container-x py-6 md:py-8">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="display mb-2 mt-3 text-3xl md:text-4xl">{title}</h1>
      {description && <p className="mb-6 max-w-2xl text-sm text-ink/70">{description}</p>}

      {/* Na telefonie chipy kategorii stoją nad siatką (blok), od md - boczna kolumna obok siatki. */}
      <div className="mt-6 md:flex md:items-start md:gap-10">
        <CategorySidebar tree={tree} activeSlug={activeSlug} totalCount={totalCount} />
        <div className="min-w-0 flex-1">
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  );
}
