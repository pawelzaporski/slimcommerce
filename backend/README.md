# slimCommerce — backend

Lekkie, headless API e-commerce (PHP 8.5, Slim 4, Eloquent ORM / SQLite).

## Instalacja

```bash
composer install
copy .env.example .env
```

## Uruchomienie

```bash
php -S localhost:8080 -t public public/index.php
```

Przy każdym starcie aplikacji (każde żądanie, bo to `php -S` bez trwałego procesu):
1. utworzy plik `database/database.sqlite`, jeśli jeszcze nie istnieje,
2. uruchomi migracje z `database/migrations/` — tylko te, które jeszcze nie zostały zapisane w tabeli `migrations` (patrz sekcja "Migracje bazy danych" niżej),
3. założy domyślne konto **superadmina** (patrz `src/Database/Seeder.php`), jeśli w bazie nie ma jeszcze żadnego użytkownika o roli `superadmin`. Dane logowania są na stałe zapisane w kodzie (nie w `.env`):
   - login: `superadmin`
   - hasło: `superadmin`

   **To konto istnieje wyłącznie do pierwszego zalogowania. Zmień jego hasło (albo usuń je i załóż innego użytkownika) zanim wystawisz backend poza lokalny development.**

## Migracje bazy danych

Każda zmiana schematu to osobny plik w `database/migrations/`, nazwany
`RRRR_MM_DD_NNNNNN_opis.php` (prefiks daty/numeru decyduje o kolejności
wykonania). Plik zwraca anonimową klasę implementującą `App\Database\Migration`:

```php
<?php

declare(strict_types=1);

use App\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return new class implements Migration {
    public function up(Builder $schema): void
    {
        $schema->create('nazwa_tabeli', function (Blueprint $table): void {
            $table->id();
            // ...
        });
    }
};
```

Tabela `migrations` śledzi, które pliki już zostały wykonane (kolumny
`migration`, `batch`, `run_at`) — `App\Database\Migrator::run()` (wołane w
`public/index.php` przy każdym starcie) wykonuje tylko te, których tam
jeszcze nie ma. To znaczy:

- **Nowa tabela** → dopisujesz nowy plik migracji z `$schema->create(...)`. Zostanie wykryty i wykonany automatycznie przy najbliższym uruchomieniu.
- **Nowa kolumna w istniejącej tabeli** → **NIE edytujesz starego pliku** (już wykonany raz, nigdy nie zostanie uruchomiony ponownie) — dopisujesz **nowy** plik migracji z późniejszym numerem, używający `$schema->table(...)` zamiast `create`:

  ```php
  return new class implements Migration {
      public function up(Builder $schema): void
      {
          $schema->table('products', function (Blueprint $table): void {
              $table->string('barcode')->nullable()->after('sku');
          });
      }
  };
  ```

Migracje idą tylko "w przód" (brak `down()`/rollbacku) — na obecnym etapie
projektu to celowe uproszczenie.

## Struktura API

API jest podzielone na dwie strefy:

- **`/api/admin/*`** — panel admina / pracownicy (tabela `users`). Wymaga tokenu JWT poza `/login`.
- **`/api/storefront/*`** — sklep, publiczne, bez autoryzacji.

### Endpointy

| Metoda | Ścieżka                 | Opis                                                    | Auth |
|--------|--------------------------|----------------------------------------------------------|------|
| GET    | `/`                      | Informacja o API (status, linki)                          | brak |
| GET    | `/docs`                  | Swagger UI                                                | brak |
| GET    | `/openapi.json`          | Specyfikacja OpenAPI 3.0                                   | brak |
| POST   | `/api/admin/login`       | Logowanie, zwraca token JWT                               | brak |
| GET    | `/api/admin/products`    | Stronicowana lista produktów (także nieaktywne), `?page=&per_page=` | Bearer JWT |
| GET    | `/api/admin/products/{id}` | Szczegóły produktu                                      | Bearer JWT |
| POST   | `/api/admin/products`    | Dodanie produktu                                           | Bearer JWT |
| PUT    | `/api/admin/products/{id}` | Edycja produktu                                          | Bearer JWT |
| DELETE | `/api/admin/products/{id}` | Usunięcie produktu                                       | Bearer JWT |
| GET    | `/api/admin/attributes`  | Lista cech wraz z wartościami                              | Bearer JWT |
| POST   | `/api/admin/attributes`  | Dodanie cechy                                               | Bearer JWT |
| PUT    | `/api/admin/attributes/{id}` | Edycja cechy                                            | Bearer JWT |
| DELETE | `/api/admin/attributes/{id}` | Usunięcie cechy (kaskadowo usuwa jej wartości)          | Bearer JWT |
| POST   | `/api/admin/attributes/{id}/values` | Dodanie wartości cechy                          | Bearer JWT |
| PUT    | `/api/admin/attribute-values/{id}` | Edycja wartości cechy                            | Bearer JWT |
| DELETE | `/api/admin/attribute-values/{id}` | Usunięcie wartości cechy                        | Bearer JWT |
| GET    | `/api/admin/products/{productId}/variants` | Lista wariantów produktu                | Bearer JWT |
| POST   | `/api/admin/products/{productId}/variants` | Dodanie wariantu (z `attribute_value_ids`) | Bearer JWT |
| PUT    | `/api/admin/variants/{id}` | Edycja wariantu                                          | Bearer JWT |
| DELETE | `/api/admin/variants/{id}` | Usunięcie wariantu                                       | Bearer JWT |
| GET    | `/api/storefront/products` | Tylko aktywne produkty                                   | brak |

Przykładowe logowanie:

```bash
curl -X POST http://localhost:8080/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin","password":"superadmin"}'
```

Zwrócony `token` przekazujesz w kolejnych żądaniach do `/api/admin/*`:

```bash
curl http://localhost:8080/api/admin/products \
  -H "Authorization: Bearer <token>"
```

## Dokumentacja API (OpenAPI / Swagger)

Endpointy i modele są opisane atrybutami PHP 8 (`OpenApi\Attributes`,
paczka `zircote/swagger-php`) — zobacz `src/Controllers/**` i `src/Models/**`.

Dokumentacja jest dostępna "na żywo", bez żadnego kroku budowania:

- **`GET /docs`** — interaktywny Swagger UI
- **`GET /openapi.json`** — surowa specyfikacja OpenAPI 3.0 (generowana ze skanowania atrybutów przy każdym żądaniu)

Alternatywnie, żeby zapisać specyfikację do statycznego pliku `public/openapi.json` (np. do commitowania albo użycia przez `backoffice`/`storefront` bez działającego backendu):

```bash
composer run docs
```

## Struktura katalogów

- `public/index.php` — bootstrap: `.env`, połączenie Eloquent/SQLite, migracje, seed superadmina, aplikacja Slim, trasy `api/admin` i `api/storefront`.
- `database/migrations/` — pliki migracji (jedna tabela/zmiana na plik), wykonywane po kolei.
- `src/Database/Migration.php` — interfejs pojedynczej migracji (`up(Builder $schema): void`).
- `src/Database/Migrator.php` — runner: wykonuje tylko migracje spoza tabeli `migrations`.
- `src/Database/Seeder.php` — zakłada domyślnego superadmina.
- `src/Bootstrap/Database.php` — inicjalizacja Capsule.
- `src/Support/Jwt.php` — wystawianie/weryfikacja tokenów JWT.
- `src/Middleware/AdminAuthMiddleware.php` — ochrona tras `api/admin/*`.
- `src/Controllers/Admin/` — kontrolery panelu admina (login, produkty, cechy, warianty).
- `src/Controllers/Storefront/` — kontrolery sklepu (produkty publiczne).
- `src/Controllers/DocsController.php` — serwuje `/docs` (Swagger UI) i `/openapi.json`.
- `src/Models/` — modele Eloquent.
- `src/OpenApi/ApiDefinition.php` — globalne metadane OpenAPI (`#[OA\Info]`, `#[OA\SecurityScheme]`).
