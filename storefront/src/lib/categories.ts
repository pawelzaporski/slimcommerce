import type { Category } from './types';

export interface CategoryNode extends Category {
  children: CategoryNode[];
  /** Produkty w tej kategorii + we wszystkich podkategoriach. */
  total_count: number;
}

/** Płaska lista z API -> drzewo po parent_id (kolejność alfabetyczna zachowana z API). */
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const nodes = new Map<number, CategoryNode>();

  for (const category of categories) {
    nodes.set(category.id, { ...category, children: [], total_count: category.products_count ?? 0 });
  }

  const roots: CategoryNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.parent_id ? nodes.get(node.parent_id) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sum = (node: CategoryNode): number => {
    node.total_count = (node.products_count ?? 0) + node.children.reduce((acc, child) => acc + sum(child), 0);
    return node.total_count;
  };
  roots.forEach(sum);

  return roots;
}

export function findCategory(categories: Category[], slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}

/** Ścieżka od korzenia do kategorii o danym slugu (do okruszków). */
export function categoryPath(categories: Category[], slug: string): Category[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const path: Category[] = [];
  let current = findCategory(categories, slug);
  const guard = new Set<number>();

  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    path.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }

  return path;
}

export function topLevelCategories(categories: Category[]): Category[] {
  return categories.filter((category) => !category.parent_id);
}
