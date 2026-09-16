import type { Metadata } from 'next';
import StaticPage from '@/components/StaticPage';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Polityka prywatności',
  description: `Zasady przetwarzania danych osobowych w sklepie ${SITE_NAME}.`,
};

export default function PrivacyPage() {
  return (
    <StaticPage title="Polityka prywatności" lead="Jakie dane zbieramy, po co i jak długo je przechowujemy.">
      <p className="not-prose rounded-xl bg-lemon/40 px-4 py-3 text-sm">
        To szablon polityki prywatności - uzupełnij dane administratora i dostosuj treść do faktycznie używanych narzędzi.
      </p>

      <h2>Administrator danych</h2>
      <p>Administratorem danych osobowych jest [nazwa firmy], [adres]. Kontakt: kontakt@example.com.</p>

      <h2>Jakie dane przetwarzamy</h2>
      <ul>
        <li>dane podane przy rejestracji i składaniu zamówienia (imię, nazwisko, e-mail, adres dostawy),</li>
        <li>dane o zamówieniach i płatnościach,</li>
        <li>dane techniczne niezbędne do działania sklepu (np. identyfikator koszyka zapisany w przeglądarce).</li>
      </ul>

      <h2>Cele i podstawy przetwarzania</h2>
      <ul>
        <li>realizacja zamówień i obsługa konta - wykonanie umowy,</li>
        <li>rozliczenia i księgowość - obowiązek prawny,</li>
        <li>obsługa reklamacji i zwrotów - obowiązek prawny i uzasadniony interes,</li>
        <li>newsletter - zgoda, którą możesz wycofać w każdej chwili.</li>
      </ul>

      <h2>Dane w przeglądarce</h2>
      <p>
        Sklep zapisuje w pamięci przeglądarki identyfikator koszyka, token logowania oraz listę ulubionych produktów.
        Dane te nie są przekazywane podmiotom trzecim i możesz je usunąć, czyszcząc dane witryny.
      </p>

      <h2>Twoje prawa</h2>
      <p>
        Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz
        wniesienia sprzeciwu i skargi do Prezesa UODO.
      </p>
    </StaticPage>
  );
}
