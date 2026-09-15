# slimCommerce

Monorepo projektu e-commerce, podzielony na trzy niezależne części:

| Folder | Opis | Stan |
|---|---|---|
| [`backend/`](backend/README.md) | Headless API (PHP 8.5, Slim 4, Eloquent/SQLite). Endpointy `api/admin/*` (panel, JWT, CRUD produktów) i `api/storefront/*` (sklep, publiczne). | gotowe |
| [`backoffice/`](backoffice/README.md) | Panel admina — aplikacja Electron (logowanie, lista/dodawanie/edycja/usuwanie produktów, paginacja). | gotowe |
| `storefront/` | Sklep dla klienta (frontend, konsumuje `api/storefront`). | do zrobienia |

Szczegóły uruchomienia i lista endpointów: [backend/README.md](backend/README.md).
