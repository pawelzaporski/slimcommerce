import type { Metadata } from 'next';
import StaticPage from '@/components/StaticPage';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'O nas',
  description: `Poznaj sklep ${SITE_NAME} - kim jesteśmy i jak działamy.`,
};

export default function AboutPage() {
  return (
    <StaticPage
      title="O nas"
      lead={`${SITE_NAME} to sklep internetowy zbudowany na lekkim, własnym silniku e-commerce. Stawiamy na szybkie strony, prosty proces zakupowy i uczciwe warunki.`}
    >
      <h2>Jak działamy</h2>
      <p>
        Każdy produkt w ofercie ma jasno opisane warianty, aktualny stan magazynowy i zdjęcia. Zamówienia realizujemy w
        ciągu 24 godzin od zaksięgowania płatności, a paczki wysyłamy z jednego magazynu, dzięki czemu wszystko trafia do
        Ciebie w jednej przesyłce.
      </p>
      <h2>Na co możesz liczyć</h2>
      <ul>
        <li>szybką i darmową dostawę od określonej kwoty zamówienia,</li>
        <li>14 dni na zwrot bez podawania przyczyny,</li>
        <li>bezpieczne płatności online,</li>
        <li>kontakt z prawdziwym człowiekiem, gdy coś pójdzie nie tak.</li>
      </ul>
      <h2>Kontakt</h2>
      <p>
        Masz pytanie albo pomysł, jak możemy działać lepiej? Napisz do nas przez stronę{' '}
        <a href="/kontakt">Kontakt</a> - odpowiadamy w dni robocze.
      </p>
    </StaticPage>
  );
}
