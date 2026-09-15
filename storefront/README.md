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

## Struktura

- `src/lib/api.ts` — klient API storefrontu (produkty, koszyk, logowanie/rejestracja klienta).
- `src/lib/auth.ts`, `src/lib/cart.ts` — token JWT klienta i token koszyka trzymane w `localStorage`
  (koszyk kontynuuje wzorzec już przyjęty w API — zob. komentarz w `../backend/src/Controllers/Storefront/CartController.php`).
- `src/app/produkty/[id]` — karta produktu z `generateMetadata` i JSON-LD (`Product`/`Offer`).
- `src/app/zamowienie` — checkout (koszyk -> zamówienie), dla gościa lub zalogowanego klienta;
  gość dostaje pod spodem konto (bez ustawionego hasła) i zostaje automatycznie "zalogowany" tokenem.
- `src/app/robots.ts`, `src/app/sitemap.ts` — generowane z listy produktów.

## Poza zakresem (kolejne kroki)

Płatności online (dziś tylko zapis metody/statusu `pending`, bez integracji z bramką),
historia zamówień w `/konto`, książka adresowa (zapamiętane adresy klienta),
nawigacja po kategoriach, wyszukiwanie/filtrowanie produktów, ustawianie hasła
przez klienta, który założył konto przez checkout jako gość.
