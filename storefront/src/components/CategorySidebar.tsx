import Link from 'next/link';
import type { CategoryNode } from '@/lib/categories';

interface CategorySidebarProps {
  tree: CategoryNode[];
  activeSlug?: string;
  totalCount: number;
}

function CategoryItem({ node, activeSlug, depth }: { node: CategoryNode; activeSlug?: string; depth: number }) {
  const active = node.slug === activeSlug;

  return (
    <li>
      <Link
        href={`/kategoria/${node.slug}`}
        className={`flex items-center justify-between gap-2 rounded-lg py-1.5 pr-2 hover:text-brand ${
          active ? 'font-bold text-brand' : ''
        }`}
        style={{ paddingLeft: `${depth * 0.9}rem` }}
        aria-current={active ? 'page' : undefined}
      >
        <span>{node.name}</span>
        <span className="text-xs text-muted">({node.total_count})</span>
      </Link>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <CategoryItem key={child.id} node={child} activeSlug={activeSlug} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function flatten(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

/** Lista kategorii: na desktopie boczna kolumna, na telefonie przewijane "chipy". */
export default function CategorySidebar({ tree, activeSlug, totalCount }: CategorySidebarProps) {
  const chipBase = 'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition';
  const chipActive = 'border-ink bg-ink text-white';
  const chipIdle = 'border-black/15 bg-white hover:border-ink';

  return (
    <>
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 md:hidden">
        <Link href="/produkty" className={`${chipBase} ${activeSlug ? chipIdle : chipActive}`}>
          Wszystkie
        </Link>
        {flatten(tree).map((node) => (
          <Link
            key={node.id}
            href={`/kategoria/${node.slug}`}
            className={`${chipBase} ${node.slug === activeSlug ? chipActive : chipIdle}`}
          >
            {node.name}
          </Link>
        ))}
      </div>

      <aside className="hidden w-60 shrink-0 md:block">
        <h2 className="display mb-3 flex items-baseline justify-between text-lg">
          Kategorie
          <span className="font-sans text-sm font-semibold normal-case text-brand">({totalCount})</span>
        </h2>
        <ul className="space-y-0.5 text-sm">
          <li>
            <Link
              href="/produkty"
              className={`flex items-center justify-between rounded-lg py-1.5 pr-2 hover:text-brand ${
                activeSlug ? '' : 'font-bold text-brand'
              }`}
            >
              <span>Wszystkie produkty</span>
              <span className="text-xs text-muted">({totalCount})</span>
            </Link>
          </li>
          {tree.map((node) => (
            <CategoryItem key={node.id} node={node} activeSlug={activeSlug} depth={0} />
          ))}
        </ul>
      </aside>
    </>
  );
}
