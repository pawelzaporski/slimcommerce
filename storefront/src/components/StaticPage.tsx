import type { ReactNode } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';

interface StaticPageProps {
  title: string;
  lead?: string;
  children: ReactNode;
}

export default function StaticPage({ title, lead, children }: StaticPageProps) {
  return (
    <div className="container-x py-8">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={[{ label: title }]} />
        <h1 className="display mt-4 text-4xl md:text-5xl">{title}</h1>
        {lead && <p className="mt-4 text-lg text-ink/75">{lead}</p>}
        <div className="prose-plain mt-6 text-[15px]">{children}</div>
      </div>
    </div>
  );
}
