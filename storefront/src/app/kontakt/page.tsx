import type { Metadata } from 'next';
import Link from 'next/link';
import StaticPage from '@/components/StaticPage';

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Skontaktuj się z obsługą sklepu - e-mail, telefon, godziny pracy.',
};

export default function ContactPage() {
  return (
    <StaticPage title="Kontakt" lead="Chętnie pomożemy. Wybierz najwygodniejszą formę kontaktu.">
      <div className="not-prose mt-2 grid gap-4 sm:grid-cols-2">
        <div className="card p-6">
          <p className="display text-lg">E-mail</p>
          <a href="mailto:kontakt@example.com" className="mt-1 block text-brand underline">
            kontakt@example.com
          </a>
          <p className="mt-2 text-sm text-muted">Odpowiadamy w ciągu jednego dnia roboczego.</p>
        </div>
        <div className="card p-6">
          <p className="display text-lg">Telefon</p>
          <a href="tel:+48000000000" className="mt-1 block text-brand underline">
            +48 000 000 000
          </a>
          <p className="mt-2 text-sm text-muted">pon.–pt. 8:00–18:00</p>
        </div>
      </div>

      <h2>Zanim napiszesz</h2>
      <p>
        Odpowiedzi na najczęstsze pytania o dostawę, płatności i zwroty znajdziesz na stronie{' '}
        <Link href="/pomoc">Pomoc</Link>. Pisząc w sprawie zamówienia, podaj jego numer - przyspieszy to obsługę.
      </p>

      <h2>Dane firmy</h2>
      <p>
        Dane rejestrowe sprzedawcy (nazwa, adres, NIP, KRS) znajdują się w <Link href="/regulamin">Regulaminie</Link>.
      </p>
    </StaticPage>
  );
}
