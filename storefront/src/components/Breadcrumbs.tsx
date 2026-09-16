import Link from 'next/link';
import { ChevronRightIcon } from '@/components/icons';

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const crumbs: Crumb[] = [{ label: 'Strona główna', href: '/' }, ...items];

  return (
    <nav aria-label="Okruszki" className="text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {crumb.href && !isLast ? (
                <Link href={crumb.href} className="hover:text-brand">
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-semibold text-ink' : ''} aria-current={isLast ? 'page' : undefined}>
                  {crumb.label}
                </span>
              )}
              {!isLast && <ChevronRightIcon size={12} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
