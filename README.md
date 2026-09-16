# slimCommerce

Monorepo projektu e-commerce, podzielony na trzy niezależne części:

| Folder | Opis | Stan |
|---|---|---|
| [`backend/`](backend/README.md) | Headless API (PHP 8.4, Slim 4, Eloquent/SQLite). Endpointy `api/admin/*` (panel, JWT, CRUD produktów, upload zdjęć, miejsca sprzedaży) i `api/storefront/*` (sklep, publiczne; CORS per domena miejsca sprzedaży). | gotowe |
| [`backoffice/`](backoffice/README.md) | Panel admina — aplikacja Electron (logowanie, produkty ze zdjęciami: 2 główne + galeria, paginacja, miejsca sprzedaży). | gotowe |
| [`storefront/`](storefront/README.md) | Sklep dla klienta — Next.js (SSR/ISR pod SEO/GEO), wygląd drogerii online (kategorie, nowości, wyszukiwarka, ulubione, strony informacyjne), listing i karta produktu ze zdjęciami i JSON-LD, koszyk, checkout, konto klienta. | MVP |

Szczegóły uruchomienia i lista endpointów: [backend/README.md](backend/README.md).
