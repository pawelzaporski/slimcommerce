# storefront

Sklep dla klienta — Next.js (App Router, TypeScript, Tailwind), konsumuje publiczne
API pod `NEXT_PUBLIC_API_URL` (patrz [../backend/README.md](../backend/README.md)).

Strony renderowane po stronie serwera (SSR/ISR) pod SEO i GEO — produkty i ich karty
są dostępne jako gotowy HTML (JSON-LD `Product`/`Offer` na karcie produktu), bez potrzeby
wykonywania JS przez roboty wyszukiwarek/AI.

## Uruchomienie

```bash
npm install
cp .env.local.example .env.local # domyślnie wskazuje na backend pod localhost:8080
npm run dev
```

Aplikacja startuje pod `http://localhost:3000`. Backend (`../backend`) musi działać równolegle.

## Zmienne środowiskowe

| Zmienna | Opis | Domyślnie |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Adres backendu (`api/storefront/*`) | `http://localhost:8080` |
| `NEXT_PUBLIC_SITE_URL` | Publiczny adres storefrontu (metadane, sitemap, JSON-LD) | `http://localhost:3000` |

## Wygląd i strony

Warstwa wizualna jest wzorowana na dużych drogeriach internetowych: różowy pasek promocyjny,
czarny pasek informacyjny, duża wyszukiwarka, pasek kategorii z rozwijanym menu, kondensowane
nagłówki wersalikami, ceny w kolorze marki z groszami w indeksie górnym, pastelowe sekcje.
Kolory i kroje są zdefiniowane w `src/app/globals.css` (`@theme` - `--color-brand`, `--color-rose`,
`--font-display` itd.) razem z klasami `btn`, `field`, `badge`, `display`, `card`. Czcionki: Source Sans 3
(treść) i Oswald (nagłówki) przez `next/font/google`.

| Ścieżka | Opis | Dane |
|---|---|---|
| `/` | Baner, kafelki kategorii, nowości, polecane | `products`, `categories` |
| `/produkty` | Wszystkie produkty z bocznymi kategoriami i sortowaniem (po stronie klienta) | `products`, `categories` |
| `/kategoria/[slug]` | Produkty z kategorii i jej podkategorii, okruszki ze ścieżką drzewa | `products?category=`, `categories` |
| `/nowosci` | Ostatnio dodane produkty (etykieta „Nowość” przez 30 dni) | `products` |
| `/produkty/[id]` | Karta produktu: galeria, cena, dodanie do koszyka, „Podobne produkty”, JSON-LD | `products/{id}`, `products` |
| `/szukaj?q=` | Wyszukiwanie po nazwie / SKU / kategorii - filtrowanie w przeglądarce (API nie ma wyszukiwarki) | `products` |
| `/ulubione` | Schowek trzymany w `localStorage` (serduszka na kartach) - bez wsparcia w API | `products` |
| `/koszyk`, `/zamowienie` | Koszyk z miniaturami i paskiem do darmowej dostawy, checkout w 3 krokach | koszyk / checkout |
| `/logowanie`, `/rejestracja`, `/konto` | Konto klienta | auth |
| `/o-nas`, `/kontakt`, `/pomoc`, `/regulamin`, `/polityka-prywatnosci` | Strony statyczne (treść-szablon do uzupełnienia) | - |

**Kody rabatowe i darmowa dostawa.** W koszyku jest pole na kod (`POST/DELETE /api/storefront/carts/{token}/discount-code`); wycenę (`pricing`: wartość produktów, rabat, darmowa dostawa, suma) liczy API i ta sama wycena trafia do zamówienia w checkoucie. Próg darmowej dostawy nie jest już stałą w kodzie — pochodzi z ustawień miejsca sprzedaży (`GET /api/storefront/settings`, rozpoznawanego po nagłówku `X-Sales-Channel` = `NEXT_PUBLIC_SITE_URL`, wysyłanym przez `src/lib/api.ts`); bez progu pasek nagłówka, strona główna i pasek USP pokazują neutralne teksty.

Formularz newslettera w stopce to wyłącznie UI (brak endpointu w API) - pokazuje potwierdzenie bez wysyłki.
Menu i stopka biorą kategorie z `GET /api/storefront/categories` (jedyny endpoint dodany pod storefront,
razem z filtrem `?category=slug` w liście produktów).

## Struktura

- `src/lib/api.ts` — klient API storefrontu (produkty, kategorie, koszyk, logowanie/rejestracja klienta).
- `src/lib/categories.ts` — drzewo kategorii z płaskiej listy (`parent_id`), ścieżka do okruszków.
- `src/lib/favorites.ts` — ulubione w `localStorage` + zdarzenie odświeżające licznik w nagłówku.
- `src/components/Header.tsx`, `Footer.tsx`, `CategoryMenu.tsx` — layout: paski, wyszukiwarka, menu kategorii (desktop i szuflada mobilna), stopka z USP i newsletterem.
- `src/components/ProductCard.tsx`, `PriceTag.tsx`, `ProductGrid.tsx` — karta produktu (etykieta „Nowość”, serduszko), cena w stylu drogeryjnym, siatka z sortowaniem.
- `src/lib/auth.ts`, `src/lib/cart.ts` — token JWT klienta i token koszyka trzymane w `localStorage`
  (koszyk kontynuuje wzorzec już przyjęty w API — zob. komentarz w `../backend/src/Controllers/Storefront/CartController.php`).
- `src/app/produkty/[id]` — karta produktu z `generateMetadata` i JSON-LD (`Product`/`Offer`, z listą `image`).
- `src/components/ProductGallery.tsx`, `src/lib/images.ts` — zdjęcia produktu: `image1` (główne, także na kafelku
  listingu), `image2` i `gallery` (pozostałe) z API składane w jedną listę; duże zdjęcie + miniatury.
  Obrazy idą przez `next/image` — `next.config.ts` dopuszcza host z `NEXT_PUBLIC_API_URL` (ścieżka `/uploads/**`),
  bo pliki serwuje backend z `public/uploads/`. Jeśli backend ma inne `APP_URL` (np. CDN), dopisz je w `remotePatterns`.
  Dla API na `localhost`/prywatnym IP włączane jest `images.dangerouslyAllowLocalIP` (Next 16 inaczej odrzuca takie
  obrazy kodem 400); przy publicznej domenie API flaga zostaje wyłączona. Zmiana `next.config.ts` wymaga restartu `next dev`.
- `src/app/zamowienie` — checkout (koszyk -> zamówienie), dla gościa lub zalogowanego klienta;
  gość dostaje pod spodem konto (bez ustawionego hasła) i zostaje automatycznie "zalogowany" tokenem.
- `src/app/robots.ts`, `src/app/sitemap.ts` — generowane z listy produktów.

## Poza zakresem (kolejne kroki)

Płatności online (dziś tylko zapis metody/statusu `pending`, bez integracji z bramką),
historia zamówień w `/konto`, książka adresowa (zapamiętane adresy klienta),
wyszukiwanie i filtry po stronie API (dziś w przeglądarce), promocje/przeceny
(API nie ma cen przekreślonych), ulubione i newsletter zapisywane w API,
ustawianie hasła przez klienta, który założył konto przez checkout jako gość.
