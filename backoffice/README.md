# backoffice

Panel admina jako aplikacja desktopowa (Electron). Logowanie do `api/admin`,
zarządzanie produktami (z paginacją), cechami (np. Rozmiar/Kolor) i ich
wartościami oraz wariantami produktów (SKU/EAN/cena/stan + przypisane cechy).

## Instalacja i uruchomienie

Wymaga uruchomionego backendu (patrz [../backend/README.md](../backend/README.md)).

```bash
npm install
npm start
```

Po starcie aplikacji podaj adres API (domyślnie `http://localhost:8080`) oraz
dane logowania domyślnego superadmina:

- login: `superadmin`
- hasło: `superadmin`

(konto na stałe zapisane w kodzie backendu — `backend/src/Database/Seeder.php` — nie w `.env`).

## Co robi

- **Logowanie** — `POST /api/admin/login`, token JWT trzymany w `localStorage` (per-użytkownik systemu, lokalnie na dysku).
- **Zakładka „Produkty”** — lista z paginacją (`GET /api/admin/products?page=&per_page=`), dodawanie/edycja/usuwanie.
  Przy każdym produkcie przycisk **„Warianty”** otwiera modal z listą jego wariantów
  (SKU, EAN, cena, stan magazynowy) i formularzem dodawania/edycji — łącznie z
  przypisywaniem wartości cech (po jednym rozwijanym polu na cechę, np. Rozmiar: XL).
- **Zdjęcia produktu** (w formularzu produktu) — dwa główne sloty „Zdjęcie 1 / Zdjęcie 2” oraz galeria
  „Pozostałe zdjęcia” (kolejność strzałkami). Wybrany plik od razu leci na `POST /api/admin/assets`
  (multipart), a id assetów zapisują się razem z produktem (`image1_asset_id`, `image2_asset_id`,
  `gallery_asset_ids`). „Usuń” kasuje asset w API (plik + rekord). Uwaga: plik wgrany, ale
  niezapisany z produktem (np. porzucony formularz), zostaje w bazie jako osierocony asset —
  do sprzątnięcia przez `GET/DELETE /api/admin/assets`. Lista produktów pokazuje miniaturę zdjęcia 1.
- **Zakładka „Miejsca sprzedaży”** — fronty sklepu (storefront) pod własnymi domenami: nazwa,
  domena (origin, np. `https://sklep.example.com`), aktywność. Domena aktywnego miejsca sprzedaży
  jest automatycznie dopuszczana w CORS API — patrz sekcja CORS w [../backend/README.md](../backend/README.md).
- **Zakładka „Cechy”** — lista cech (np. Rozmiar, Kolor), każda jako karta z
  wartościami w formie „chipów” do dodania/edycji/usunięcia. Dodawanie/edycja
  nazw odbywa się przez proste okienko (`prompt`), zgodnie z resztą lekkiego UI.

Każde żądanie do `api/admin/*` niesie nagłówek `Authorization: Bearer <token>`.
Wygaśnięcie/nieważność tokenu (odpowiedź 401) automatycznie wylogowuje i wraca
do ekranu logowania. Na dole okna widoczny jest log ostatnich zapytań (do 50,
rozwijany) — przydatny przy diagnozowaniu problemów z API.

## Struktura

- `main.js` — proces główny Electron (okno, bez node integration w rendererze).
- `src/index.html` — layout (logowanie, zakładki Produkty/Cechy, modale produktu i wariantów, log zapytań).
- `src/renderer.js` — cała logika: wywołania API (`fetch`), stan, render list/tabel, obsługa zakładek i modali.
- `src/styles.css` — stylowanie (jasny/ciemny motyw wg `prefers-color-scheme`).

## Uwaga bezpieczeństwa

Token JWT jest trzymany w `localStorage` rendererowym — wygodne dla narzędzia
wewnętrznego/deweloperskiego, ale to nie jest bezpieczne miejsce na sekrety w
aplikacji produkcyjnej dla szerszej dystrybucji. Do tego celu warto rozważyć
`safeStorage` z Electrona (szyfrowanie na poziomie OS) zamiast `localStorage`.
