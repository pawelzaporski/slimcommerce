import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  text?: string;
  href?: string;
  linkLabel?: string;
}

export default function EmptyState({ title, text, href = '/produkty', linkLabel = 'Przejdź do produktów' }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <p className="display text-2xl">{title}</p>
      {text && <p className="mt-2 max-w-md text-sm text-muted">{text}</p>}
      <Link href={href} className="btn btn-brand mt-6">
        {linkLabel}
      </Link>
    </div>
  );
}
