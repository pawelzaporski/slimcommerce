import { formatPrice, splitPrice } from '@/lib/site';

interface PriceTagProps {
  value: string | number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES: Record<NonNullable<PriceTagProps['size']>, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-5xl',
};

/** Cena w stylu drogeryjnym: duże złote, grosze w indeksie górnym, "zł" małe. */
export default function PriceTag({ value, size = 'md', className = '' }: PriceTagProps) {
  const { zl, gr } = splitPrice(value);

  return (
    <p className={`display text-brand ${SIZES[size]} ${className}`} aria-label={formatPrice(value)}>
      <span>{zl}</span>
      <sup className="ml-0.5 text-[0.5em]">{gr}</sup>
      <span className="ml-1 text-[0.42em] font-semibold">zł</span>
    </p>
  );
}
