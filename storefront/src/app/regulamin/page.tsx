import type { Metadata } from 'next';
import StaticPage from '@/components/StaticPage';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Regulamin',
  description: `Regulamin sklepu internetowego ${SITE_NAME}.`,
};

export default function TermsPage() {
  return (
    <StaticPage title="Regulamin" lead="Zasady korzystania ze sklepu internetowego i składania zamówień.">
      <p className="not-prose rounded-xl bg-lemon/40 px-4 py-3 text-sm">
        To szablon regulaminu - przed uruchomieniem sprzedaży uzupełnij dane sprzedawcy i skonsultuj treść z prawnikiem.
      </p>

      <h2>§1 Postanowienia ogólne</h2>
      <ol>
        <li>Sklep internetowy {SITE_NAME} prowadzony jest przez [nazwa firmy], [adres], NIP [numer], KRS [numer].</li>
        <li>Regulamin określa zasady składania zamówień, dostawy, płatności oraz odstąpienia od umowy.</li>
        <li>Złożenie zamówienia oznacza akceptację regulaminu.</li>
      </ol>

      <h2>§2 Zamówienia</h2>
      <ol>
        <li>Zamówienia można składać przez całą dobę, siedem dni w tygodniu.</li>
        <li>Umowa sprzedaży zostaje zawarta z chwilą potwierdzenia przyjęcia zamówienia przez sklep.</li>
        <li>Ceny podane są w złotych polskich i zawierają podatek VAT.</li>
      </ol>

      <h2>§3 Dostawa i płatność</h2>
      <ol>
        <li>Dostępne metody dostawy i płatności oraz ich koszty prezentowane są w trakcie składania zamówienia.</li>
        <li>Czas realizacji zamówienia wynosi do 2 dni roboczych od zaksięgowania płatności.</li>
      </ol>

      <h2>§4 Odstąpienie od umowy</h2>
      <ol>
        <li>Konsument może odstąpić od umowy w terminie 14 dni bez podania przyczyny.</li>
        <li>Zwracany towar należy odesłać w stanie niezmienionym, wraz z dowodem zakupu.</li>
        <li>Zwrot płatności następuje w terminie 14 dni od otrzymania oświadczenia o odstąpieniu.</li>
      </ol>

      <h2>§5 Reklamacje</h2>
      <ol>
        <li>Sprzedawca odpowiada za zgodność towaru z umową na zasadach określonych w przepisach prawa.</li>
        <li>Reklamacje rozpatrywane są w terminie 14 dni od ich otrzymania.</li>
      </ol>

      <h2>§6 Postanowienia końcowe</h2>
      <ol>
        <li>W sprawach nieuregulowanych stosuje się przepisy prawa polskiego.</li>
        <li>Sklep zastrzega sobie prawo do zmiany regulaminu; zmiany nie dotyczą zamówień złożonych przed ich wejściem w życie.</li>
      </ol>
    </StaticPage>
  );
}
