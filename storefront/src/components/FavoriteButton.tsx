'use client';

import { useEffect, useState } from 'react';
import { HeartIcon } from '@/components/icons';
import { isFavorite, onFavoritesChanged, toggleFavorite } from '@/lib/favorites';

interface FavoriteButtonProps {
  productId: number;
  className?: string;
  size?: number;
  withLabel?: boolean;
}

export default function FavoriteButton({ productId, className = '', size = 20, withLabel = false }: FavoriteButtonProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const refresh = () => setActive(isFavorite(productId));
    refresh();
    return onFavoritesChanged(refresh);
  }, [productId]);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setActive(toggleFavorite(productId));
      }}
      aria-pressed={active}
      aria-label={active ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white text-ink shadow-sm transition hover:border-brand hover:text-brand ${
        withLabel ? 'h-12 px-5 text-xs font-bold uppercase tracking-wider' : 'h-9 w-9'
      } ${active ? 'text-brand' : ''} ${className}`}
    >
      <HeartIcon size={size} filled={active} />
      {withLabel && (active ? 'W ulubionych' : 'Do ulubionych')}
    </button>
  );
}
