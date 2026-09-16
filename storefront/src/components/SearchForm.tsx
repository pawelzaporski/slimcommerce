'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { SearchIcon } from '@/components/icons';

interface SearchFormProps {
  className?: string;
  initialQuery?: string;
  autoFocus?: boolean;
}

/** Wyszukiwarka - filtrowanie odbywa się w /szukaj po stronie klienta (API nie ma wyszukiwania). */
export default function SearchForm({ className = '', initialQuery = '', autoFocus = false }: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/szukaj?q=${encodeURIComponent(trimmed)}` : '/szukaj');
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={`relative w-full ${className}`}>
      <SearchIcon size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/60" />
      <input
        type="search"
        name="q"
        value={query}
        autoFocus={autoFocus}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Szukaj w sklepie…"
        aria-label="Szukaj produktów"
        className="w-full rounded-full bg-smoke py-3 pl-12 pr-4 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-brand/30"
      />
    </form>
  );
}
