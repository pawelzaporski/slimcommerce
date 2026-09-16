'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '@/components/icons';
import type { CategoryNode } from '@/lib/categories';

/** Rozwijane "Wszystkie kategorie" w pasku nawigacji (desktop). */
export default function CategoryMenu({ tree }: { tree: CategoryNode[] }) {
  const pathname = usePathname();
  // Panel pamięta ścieżkę, na której go otwarto - nawigacja zamyka go sama.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (value: boolean | ((current: boolean) => boolean)) =>
    setOpenAt((current) => {
      const next = typeof value === 'function' ? value(current === pathname) : value;
      return next ? pathname : null;
    });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpenAt(null);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenAt(null);
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative h-full"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        // Klik tylko otwiera (na desktopie panel i tak otwiera się po najechaniu, więc
        // przełączanie zamykałoby go od razu); zamknięcie: klik poza, Escape, zjechanie myszą.
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`nav-link flex h-full items-center gap-1.5 border-b-2 ${open ? 'border-brand text-brand' : 'border-transparent'}`}
      >
        Wszystkie kategorie
        <ChevronDownIcon size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 w-[min(56rem,90vw)] rounded-b-2xl border border-black/10 bg-white p-6 shadow-2xl">
          {tree.length === 0 ? (
            <p className="text-sm text-muted">Brak zdefiniowanych kategorii.</p>
          ) : (
            <div className="grid grid-cols-3 gap-x-8 gap-y-6 lg:grid-cols-4">
              {tree.map((root) => (
                <div key={root.id}>
                  <Link
                    href={`/kategoria/${root.slug}`}
                    className="display flex items-baseline justify-between gap-2 border-b border-black/10 pb-1.5 text-base hover:text-brand"
                  >
                    <span>{root.name}</span>
                    <span className="font-sans text-xs font-normal normal-case text-muted">{root.total_count}</span>
                  </Link>
                  {root.children.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {root.children.map((child) => (
                        <li key={child.id}>
                          <Link href={`/kategoria/${child.slug}`} className="block py-0.5 text-sm text-ink/80 hover:text-brand">
                            {child.name}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link href={`/kategoria/${root.slug}`} className="block py-0.5 text-sm font-semibold text-brand">
                          Zobacz wszystkie
                        </Link>
                      </li>
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
