import Link from 'next/link';
import { ArrowRightIcon } from '@/components/icons';

interface SectionHeadingProps {
  title: string;
  href?: string;
  linkLabel?: string;
  as?: 'h1' | 'h2';
}

export default function SectionHeading({ title, href, linkLabel = 'Zobacz wszystkie', as: Tag = 'h2' }: SectionHeadingProps) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <Tag className="display text-2xl md:text-3xl">{title}</Tag>
      {href && (
        <Link href={href} className="nav-link flex items-center gap-1 text-brand">
          {linkLabel}
          <ArrowRightIcon size={16} />
        </Link>
      )}
    </div>
  );
}
