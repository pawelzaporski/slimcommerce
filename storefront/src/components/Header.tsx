'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import CategoryMenu from '@/components/CategoryMenu';
import SearchForm from '@/components/SearchForm';
import {
  BagIcon,
  ChevronRightIcon,
  CloseIcon,
  HeartIcon,
  LogoMark,
  MenuIcon,
  TruckIcon,
  UserIcon,
} from '@/components/icons';
import { getCart } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getCartToken } from '@/lib/cart';
import { buildCategoryTree, type CategoryNode } from '@/lib/categories';
import { onStorefrontUpdated } from '@/lib/events';
import { getFavoriteIds, onFavoritesChanged } from '@/lib/favorites';
import { FREE_SHIPPING_FROM, SITE_NAME, SITE_TAGLINE } from '@/lib/site';
import type { Category } from '@/lib/types';

const INFO_LINKS = [
  { href: '/o-nas', label: 'O nas' },
  { href: '/pomoc', label: 'Pomoc' },
  { href: '/kontakt', label: 'Kontakt' },
  { href: '/regulamin', label: 'Regulamin' },
];

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function MobileCategoryList({ nodes, depth = 0 }: { nodes: CategoryNode[]; depth?: number }) {
  return (
    <ul className={depth === 0 ? 'space-y-1' : 'ml-4 mt-1 space-y-1 border-l border-black/10 pl-3'}>
      {nodes.map((node) => (
        <li key={node.id}>
          <Link
            href={`/kategoria/${node.slug}`}
            className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-semibold hover:bg-smoke"
          >
            <span>{node.name}</span>
            <span className="text-xs font-normal text-muted">{node.total_count}</span>
          </Link>
          {node.children.length > 0 && <MobileCategoryList nodes={node.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

export default function Header({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const [itemCount, setItemCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  // Menu mobilne pamięta ścieżkę, na której je otwarto - zmiana trasy (kliknięcie
  // linku) automatycznie je zamyka, bez dodatkowego efektu.
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null);
  const menuOpen = menuOpenAt === pathname;
  const setMenuOpen = (open: boolean) => setMenuOpenAt(open ? pathname : null);

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const topCategories = tree.slice(0, 5);

  useEffect(() => {
    function refresh() {
      setLoggedIn(Boolean(getToken()));

      const cartToken = getCartToken();
      if (!cartToken) {
        setItemCount(0);
        return;
      }

      getCart(cartToken)
        .then((cart) => setItemCount(cart.items.reduce((sum, item) => sum + item.quantity, 0)))
        .catch(() => setItemCount(0));
    }

    refresh();
    return onStorefrontUpdated(refresh);
  }, []);

  useEffect(() => {
    const refresh = () => setFavoriteCount(getFavoriteIds().length);
    refresh();
    return onFavoritesChanged(refresh);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const iconButton =
    'relative inline-flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-smoke sm:h-10 sm:w-10';

  return (
    <header className="relative z-40 bg-white">
      {/* Pasek promocyjny */}
      <div className="bg-brand text-white">
        <div className="container-x flex items-center justify-center gap-4 py-2 text-center text-xs font-semibold sm:text-sm">
          <span>Darmowa dostawa od {FREE_SHIPPING_FROM} zł i 14 dni na zwrot bez podawania przyczyny</span>
          <Link href="/nowosci" className="btn btn-black btn-sm hidden sm:inline-flex">
            Zobacz nowości
          </Link>
        </div>
      </div>

      {/* Czarny pasek informacyjny */}
      <div className="bg-ink text-white">
        <div className="container-x flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <TruckIcon size={20} />
            <span className="nav-link">Darmowa dostawa od {FREE_SHIPPING_FROM} zł</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Informacje">
            {INFO_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link text-white/90">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Główny pasek: logo, wyszukiwarka, ikony */}
      <div className="container-x flex items-center gap-2 py-3 sm:gap-3 md:gap-8 md:py-5">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className={`${iconButton} shrink-0 md:hidden`}
          aria-label="Otwórz menu"
        >
          <MenuIcon />
        </button>

        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5" aria-label={`${SITE_NAME} - strona główna`}>
          <span className="shrink-0 [&>svg]:h-8 [&>svg]:w-8 sm:[&>svg]:h-9 sm:[&>svg]:w-9">
            <LogoMark size={36} />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="display truncate text-lg text-brand sm:text-2xl md:text-3xl">{SITE_NAME}</span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:block">
              {SITE_TAGLINE}
            </span>
          </span>
        </Link>

        <SearchForm className="hidden max-w-2xl flex-1 md:flex" />

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
          <Link href={loggedIn ? '/konto' : '/logowanie'} className={iconButton} aria-label={loggedIn ? 'Moje konto' : 'Zaloguj się'}>
            <UserIcon />
          </Link>
          <Link href="/ulubione" className={iconButton} aria-label="Ulubione">
            <HeartIcon />
            <CountBadge count={favoriteCount} />
          </Link>
          <Link href="/koszyk" className={iconButton} aria-label="Koszyk">
            <BagIcon />
            <CountBadge count={itemCount} />
          </Link>
        </div>
      </div>

      {/* Wyszukiwarka na małych ekranach */}
      <div className="container-x pb-3 md:hidden">
        <SearchForm />
      </div>

      {/* Nawigacja kategorii */}
      <nav className="hidden border-y border-black/10 md:block" aria-label="Kategorie">
        <div className="container-x flex h-12 items-center gap-7">
          <CategoryMenu tree={tree} />
          <Link href="/nowosci" className="nav-link text-brand">
            Nowości
          </Link>
          <Link href="/produkty" className="nav-link">
            Wszystkie produkty
          </Link>
          {topCategories.map((category) => (
            <Link key={category.id} href={`/kategoria/${category.slug}`} className="nav-link">
              {category.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Menu mobilne */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Zamknij menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
              <span className="display text-xl text-brand">{SITE_NAME}</span>
              <button type="button" onClick={() => setMenuOpen(false)} className={iconButton} aria-label="Zamknij menu">
                <CloseIcon />
              </button>
            </div>

            <div className="space-y-6 px-4 py-5">
              <div className="space-y-1">
                <Link href="/nowosci" className="flex items-center justify-between rounded-lg px-2 py-2 nav-link text-brand">
                  Nowości <ChevronRightIcon size={16} />
                </Link>
                <Link href="/produkty" className="flex items-center justify-between rounded-lg px-2 py-2 nav-link">
                  Wszystkie produkty <ChevronRightIcon size={16} />
                </Link>
                <Link href="/ulubione" className="flex items-center justify-between rounded-lg px-2 py-2 nav-link">
                  Ulubione <ChevronRightIcon size={16} />
                </Link>
              </div>

              <div>
                <p className="display mb-2 text-sm text-muted">Kategorie</p>
                {tree.length === 0 ? (
                  <p className="px-2 text-sm text-muted">Brak kategorii.</p>
                ) : (
                  <MobileCategoryList nodes={tree} />
                )}
              </div>

              <div>
                <p className="display mb-2 text-sm text-muted">Informacje</p>
                <ul className="space-y-1">
                  {INFO_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="block rounded-lg px-2 py-2 text-sm font-semibold hover:bg-smoke">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-black/10 pt-4">
                {loggedIn ? (
                  <Link href="/konto" className="btn btn-outline w-full">
                    Moje konto
                  </Link>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href="/logowanie" className="btn btn-brand w-full">
                      Zaloguj się
                    </Link>
                    <Link href="/rejestracja" className="btn btn-outline w-full">
                      Załóż konto
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
