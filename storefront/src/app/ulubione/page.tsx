import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import FavoritesList from '@/components/FavoritesList';

export const metadata: Metadata = {
  title: 'Ulubione',
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <div className="container-x py-6 md:py-8">
      <Breadcrumbs items={[{ label: 'Ulubione' }]} />
      <h1 className="display mb-8 mt-3 text-3xl md:text-4xl">Ulubione</h1>
      <FavoritesList />
    </div>
  );
}
