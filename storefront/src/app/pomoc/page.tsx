import type { Metadata } from 'next';
import Link from 'next/link';
import StaticPage from '@/components/StaticPage';
import { FREE_SHIPPING_FROM } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Pomoc',
  description: 'Dostawa, płatności, zwroty i reklamacje - odpowiedzi na najczęstsze pytania.',
};

const SECTIONS = [
  { id: 'dostawa', label: 'Dostawa' },
  { id: 'platnosci', label: 'Płatności' },
  { id: 'zwroty', label: 'Zwroty i reklamacje' },
  { id: 'konto', label: 'Konto i zamówienia' },
];

export default function HelpPage() {
  return (
    <StaticPage title="Pomoc" lead="Najczęstsze pytania o zakupy w naszym sklepie w jednym miejscu.">
      <nav aria-label="Sekcje pomocy" className="not-prose mb-6 flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-black/15 px-3.5 py-1.5 text-xs font-semibold transition hover:border-ink"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <h2 id="dostawa">Dostawa</h2>
      <h3>Ile kosztuje dostawa?</h3>
      <p>
        Koszt zależy od wybranej metody dostawy i jest widoczny w podsumowaniu zamówienia. Zamówienia od{' '}
        {FREE_SHIPPING_FROM} zł wysyłamy za darmo.
      </p>
      <h3>Kiedy otrzymam paczkę?</h3>
      <p>
        Zamówienia opłacone do godziny 12:00 w dzień roboczy wysyłamy tego samego dnia. Kurier dostarcza paczkę zwykle
        następnego dnia roboczego.
      </p>

      <h2 id="platnosci">Płatności</h2>
      <h3>Jak mogę zapłacić?</h3>
      <p>Metodę płatności wybierasz w trakcie składania zamówienia. Dostępne opcje to m.in. BLIK, karta i przelew.</p>
      <h3>Czy otrzymam fakturę?</h3>
      <p>Tak - jeśli podasz dane firmy w zamówieniu, faktura zostanie wystawiona automatycznie.</p>

      <h2 id="zwroty">Zwroty i reklamacje</h2>
      <h3>Ile mam czasu na zwrot?</h3>
      <p>14 dni od otrzymania przesyłki, bez podawania przyczyny. Produkt powinien być nieużywany i kompletny.</p>
      <h3>Jak zgłosić reklamację?</h3>
      <p>
        Napisz do nas przez stronę <Link href="/kontakt">Kontakt</Link>, podając numer zamówienia i opis problemu.
        Rozpatrujemy reklamacje w ciągu 14 dni.
      </p>

      <h2 id="konto">Konto i zamówienia</h2>
      <h3>Czy muszę zakładać konto?</h3>
      <p>
        Nie - zamówienie złożysz jako gość. Konto ułatwia kolejne zakupy, bo zapamiętujemy Twoje dane. Możesz je założyć
        na stronie <Link href="/rejestracja">Rejestracja</Link>.
      </p>
      <h3>Gdzie sprawdzę status zamówienia?</h3>
      <p>Po złożeniu zamówienia wysyłamy potwierdzenie e-mailem, a o wysyłce informujemy osobną wiadomością.</p>
    </StaticPage>
  );
}
