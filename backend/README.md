# slimCommerce — backend

Lekkie, headless API e-commerce (PHP 8.4, Slim 4, Eloquent ORM / SQLite).

## Instalacja

```bash
composer install

# macOS / Linux
cp .env.example .env

# Windows (cmd.exe)
copy .env.example .env
```

## Uruchomienie

```bash
php -S localhost:8080 -t public public/index.php
```

Przy każdym starcie aplikacji (każde żądanie, bo to `php -S` bez trwałego procesu):
1. utworzy plik `database/database.sqlite`, jeśli jeszcze nie istnieje (SQLite w trybie WAL, patrz `DB_SQLITE_WAL`),
2. **jeśli `DB_AUTO_MIGRATE=true`** (domyślnie) — uruchomi migracje z `database/migrations/` — tylko te, które jeszcze nie zostały zapisane w tabeli `migrations` (patrz sekcja "Migracje bazy danych" niżej); przy `false` migracje uruchamiasz ręcznie (patrz "Wdrożenie na shared hosting"),
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

## Wdrożenie na shared hosting

Ustawienia w `.env`, które na współdzielonym hostingu (Apache + PHP, bez SSH, bez Redisa) mają znaczenie:

| Klucz | Produkcyjnie | Po co |
|---|---|---|
| `APP_DEBUG` | `false` | przy `true` stack trace leci do odpowiedzi JSON |
| `APP_URL` | `https://api.twojadomena.pl` | adresy zdjęć nie są wtedy budowane z nagłówka `Host` żądania |
| `LOG_PATH` | `storage/logs/php-error.log` | jedyne miejsce, gdzie zobaczysz błędy — log Apache jest zwykle niedostępny. Katalog musi być zapisywalny dla PHP i **niedostępny z WWW** |
| `DB_SQLITE_WAL` / `DB_BUSY_TIMEOUT_MS` | `true` / `5000` | mniej „database is locked” przy równoległych żądaniach; obok bazy powstają pliki `-wal` i `-shm` (katalog `database/` musi być zapisywalny) |
| `DB_AUTO_MIGRATE` | `false` | migracje nie odpalają się przy każdym żądaniu; uruchamiasz je raz po wgraniu nowej wersji |
| `MIGRATE_SECRET` | losowy ciąg | klucz do ręcznego uruchomienia migracji przez HTTP (poniżej) |
| `MAIL_*` | SMTP z panelu hostingu | potwierdzenia zamówień; `MAIL_MAILER=log` tylko lokalnie |
| `JWT_SECRET` | losowe ≥ 32 znaki | placeholder z `.env.example` nie może trafić na produkcję |

**Migracje przy `DB_AUTO_MIGRATE=false`.** Po wgraniu plików wywołaj jedno z dwóch:

```bash
php bin/migrate.php
```

albo (bez SSH) żądanie HTTP:

```bash
curl -X POST https://api.twojadomena.pl/api/admin/migrate -H "X-Migrate-Key: <MIGRATE_SECRET>"
```

Odpowiedź zawiera listę wykonanych migracji (`executed`). Bez ustawionego `MIGRATE_SECRET` endpoint zwraca 404. Migracje i seed superadmina biegną zawsze pod blokadą plikową (`database/.install.lock`), więc dwa równoległe wywołania nie wykonają tej samej migracji dwa razy.

**Katalog `public/uploads/`** ma własny `.htaccess`, który blokuje wykonywanie PHP i listowanie katalogu, a serwuje wyłącznie obrazy. Wymaga `AllowOverride All` (standard na shared hostingu). Limit wielkości pliku to 10 MB przycięte do `upload_max_filesize` / `post_max_size` z php.ini hostera — komunikat błędu 422 pokazuje realny limit.

**E-mail.** Po checkoucie klient dostaje potwierdzenie zamówienia (`src/Mail/OrderConfirmationMail.php`). Wysyłka idzie przez PHPMailer/SMTP; błąd SMTP jest logowany do `LOG_PATH` i nie przerywa złożenia zamówienia. Lokalnie `MAIL_MAILER=log` zapisuje treść wiadomości do logu zamiast wysyłać.

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
| GET    | `/api/admin/assets`      | Stronicowana lista plików (zdjęć), `?page=&per_page=`      | Bearer JWT |
| POST   | `/api/admin/assets`      | Upload pliku (`multipart/form-data`, pole `file`, opcjonalnie `alt`, `external_id`) | Bearer JWT |
| GET    | `/api/admin/assets/{id}` | Szczegóły pliku                                            | Bearer JWT |
| PUT    | `/api/admin/assets/{id}` | Edycja `alt` / `external_id`                                | Bearer JWT |
| DELETE | `/api/admin/assets/{id}` | Usunięcie pliku (zeruje `image1/2` w produktach, czyści galerię) | Bearer JWT |
| GET    | `/api/admin/sales-channels` | Lista miejsc sprzedaży                                  | Bearer JWT |
| POST   | `/api/admin/sales-channels` | Dodanie miejsca sprzedaży (`name`, `domain`, `is_active`) | Bearer JWT |
| PUT    | `/api/admin/sales-channels/{id}` | Edycja miejsca sprzedaży                           | Bearer JWT |
| DELETE | `/api/admin/sales-channels/{id}` | Usunięcie miejsca sprzedaży                        | Bearer JWT |
| GET    | `/api/storefront/products` | Tylko aktywne produkty (z `categories`, `image1`, `image2`); `?category=slug` zawęża do kategorii i jej podkategorii | brak |
| GET    | `/api/storefront/categories` | Wszystkie kategorie (płasko, `parent_id`) z `products_count` aktywnych produktów | brak |
| GET    | `/api/storefront/products/{id}` | Szczegóły aktywnego produktu (warianty, kategorie, `image1`, `image2`, `gallery`) | brak |
| POST   | `/api/storefront/register` | Rejestracja klienta, zwraca token JWT                    | brak |
| POST   | `/api/storefront/login`  | Logowanie klienta, zwraca token JWT                        | brak |
| GET    | `/api/storefront/me`     | Profil zalogowanego klienta                                | Bearer JWT (klient) |
| POST   | `/api/storefront/checkout` | Zamienia koszyk (cart_token) w zamówienie - dla gościa (email/imię/nazwisko w body) lub zalogowanego klienta (Bearer JWT) | opcjonalnie Bearer JWT (klient) |
| GET    | `/api/storefront/shipping-methods` | Lista metod dostawy do wyboru w checkout                | brak |
| GET    | `/api/storefront/payment-methods` | Lista metod płatności do wyboru w checkout               | brak |

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

## Zdjęcia produktów (assets)

Pliki wgrywane przez panel lądują w `public/uploads/RRRR/MM/<losowa-nazwa>.<ext>`
(katalog jest w `.gitignore`), a ich metadane w tabeli **`assets`** (`filename`,
`path`, `mime_type`, `size`, `width`, `height`, `alt`). W odpowiedziach API każdy
asset ma gotowe pole `url` = `APP_URL` + `path` (`APP_URL` w `.env`; gdy puste,
brany jest schemat + `Host` bieżącego żądania - wystarcza lokalnie).

Powiązanie z produktem:

- **`products.image1_asset_id`**, **`products.image2_asset_id`** - dwa główne
  zdjęcia (np. przód / tył) trzymane wprost na produkcie, zwracane jako
  obiekty `image1` / `image2`;
- **`product_assets`** (`product_id`, `asset_id`, `position`) - pozostałe
  zdjęcia (galeria), zwracane jako tablica `gallery` posortowana po `position`.

Przepływ: `POST /api/admin/assets` (multipart, pole `file`) → w odpowiedzi `id`
→ `POST/PUT /api/admin/products/{id}` z `image1_asset_id`, `image2_asset_id`
i/lub `gallery_asset_ids: [..]` (kolejność tablicy = kolejność w galerii,
zastępuje całą galerię). Przykład:

```bash
curl -X POST http://localhost:8080/api/admin/assets \
  -H "Authorization: Bearer <token>" \
  -F "file=@zdjecie.jpg" -F "alt=Koszulka - przód"
```

Dozwolone typy (wykrywane z treści pliku, nie z nagłówka): JPEG, PNG, WebP, GIF,
AVIF; limit 10 MB - w praktyce ogranicza też `upload_max_filesize` /
`post_max_size` z `php.ini` (domyślnie 2 MB / 8 MB; przy `php -S` podnieś np.
`php -d upload_max_filesize=10M -d post_max_size=12M -S localhost:8080 -t public public/index.php`).
Usunięcie assetu kasuje plik i zeruje odwołania w produktach.

`php -S` z routerem (`public/index.php`) kieruje każde żądanie do PHP, dlatego
na początku `index.php` jest przepuszczenie istniejących plików z `public/`
(`return false`) - dzięki temu `/uploads/...` serwowane są bezpośrednio. Na
produkcji (nginx/Apache) zrób to samo po stronie serwera WWW.

## Kody rabatowe i darmowa dostawa

Definicje kodów: `GET|POST /api/admin/discount-codes`, `GET|PUT|DELETE /api/admin/discount-codes/{id}` (panel: zakładka „Kody rabatowe”). Typy (`type`):

| `type` | Działanie | `value` |
|---|---|---|
| `percent_cart` | rabat % od wartości wszystkich produktów w koszyku | procent (0–100) |
| `amount_cart` | rabat kwotowy od wartości koszyka (nie więcej niż wartość koszyka) | zł |
| `percent_product` | rabat % tylko na produkty z listy `product_ids` | procent |
| `amount_product` | rabat kwotowy **za każdą sztukę** produktu z listy `product_ids` (nie więcej niż cena sztuki) | zł |
| `free_shipping` | darmowa dostawa (koszt dostawy = 0) | — |

Wspólne ograniczenia: `min_cart_amount` (minimalna wartość produktów przed rabatem), `starts_at` / `ends_at` (sama data `RRRR-MM-DD` = od początku / do końca dnia), `usage_limit` (licznik `used_count` rośnie przy każdym złożonym zamówieniu), `is_active`. Kod wpisany przez klienta jest normalizowany (wielkie litery, bez spacji).

**Darmowa dostawa od kwoty** to ustawienie miejsca sprzedaży (`free_shipping_from` w `sales_channels`, w panelu w formularzu miejsca sprzedaży). Próg porównywany jest z wartością koszyka **po rabacie**. Miejsce sprzedaży rozpoznawane jest po nagłówku `X-Sales-Channel` (storefront wysyła w nim swój `NEXT_PUBLIC_SITE_URL`), potem po `Origin`; gdy nic nie pasuje, a aktywne jest dokładnie jedno miejsce sprzedaży, brane jest ono. `GET /api/storefront/settings` zwraca próg dla bieżącego sklepu.

**Koszyk (storefront):** `POST /api/storefront/carts/{token}/discount-code` (`{"code": "LATO20"}`) przypina kod, `DELETE` go zdejmuje. Każda odpowiedź z koszykiem zawiera:

```json
{
  "discount_code": {"code": "LATO20", "type": "percent_cart", "value": 20},
  "discount_error": null,
  "pricing": {
    "items_total": 120.0, "discount_amount": 24.0, "subtotal": 96.0,
    "free_shipping": false, "free_shipping_reason": null, "free_shipping_from": 199.0,
    "shipping_amount": 0.0, "total": 96.0
  }
}
```

`free_shipping_reason` to `code` (kod `free_shipping`) albo `threshold` (próg miejsca sprzedaży). Kod, który przestał być ważny, jest automatycznie odpinany, a powód wraca w `discount_error`. `shipping_amount` w koszyku jest zawsze 0 (metoda dostawy wybierana jest dopiero w checkoucie).

**Checkout** liczy wszystko tą samą klasą (`src/Support/CartPricing.php`) i zapisuje w zamówieniu `items_amount`, `discount_code` (snapshot), `discount_amount`, `shipping_amount` i `total_amount = items_amount - discount_amount + shipping_amount`. Nieważny kod daje 422 z `errors.discount_code`. Opcjonalne pole `discount_code` w body nadpisuje kod przypięty do koszyka.

## Miejsca sprzedaży i CORS

Tabela **`sales_channels`** (`name`, `domain`, `is_active`, `external_id`) opisuje
fronty sklepu (storefront) pod własnymi domenami. `domain` to pełny origin
(`https://sklep.example.com`, `http://localhost:3000`) - wartość podana bez
schematu dostaje `https://`, ścieżka/query są ucinane, wielkość liter
normalizowana.

Middleware CORS w `public/index.php` buduje listę dozwolonych originów z:

1. `CORS_ALLOWED_ORIGIN` z `.env` - `*` (domyślnie, dev: wszystko dozwolone)
   albo lista po przecinku (może być pusta),
2. **domen aktywnych miejsc sprzedaży** - zawsze, o ile `CORS_ALLOWED_ORIGIN`
   nie jest `*`.

Gdy `Origin` żądania jest na liście, jest odbijany w
`Access-Control-Allow-Origin` (+ `Vary: Origin`); gdy nie - nagłówka nie ma i
przeglądarka blokuje odpowiedź. Produkcyjny scenariusz: w `.env`
`CORS_ALLOWED_ORIGIN=https://admin.example.com` (albo puste), a każdy storefront
dodajesz w panelu jako miejsce sprzedaży - bez restartu i bez edycji `.env`.
Panel Electron ładowany z `file://` wysyła `Origin: null`; jeśli używasz go
przy restrykcyjnej liście, dopisz `null` do `CORS_ALLOWED_ORIGIN`.

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
- `src/Database/Installer.php` — migracje + seed pod blokadą plikową (wołane przy `DB_AUTO_MIGRATE=true`, z `bin/migrate.php` i z `POST /api/admin/migrate`).
- `bin/migrate.php` — ręczne uruchomienie migracji z CLI.
- `src/Bootstrap/Database.php` — inicjalizacja Capsule (ścieżka, WAL, busy_timeout z `.env`).
- `src/Bootstrap/Logging.php` — kierowanie błędów PHP do pliku `LOG_PATH`.
- `src/Support/Mailer.php` — wysyłka e-maili (PHPMailer/SMTP, tryby `smtp`/`log`/`none`).
- `src/Mail/OrderConfirmationMail.php` — treść potwierdzenia zamówienia.
- `src/Controllers/MaintenanceController.php` — `POST /api/admin/migrate` (sekret `MIGRATE_SECRET`).
- `storage/logs/` — logi błędów (poza repo).
- `src/Support/Jwt.php` — wystawianie/weryfikacja tokenów JWT.
- `src/Middleware/AdminAuthMiddleware.php` — ochrona tras `api/admin/*`.
- `src/Controllers/Admin/` — kontrolery panelu admina (login, produkty, cechy, warianty, assety/upload, miejsca sprzedaży).
- `public/uploads/` — wgrane pliki (poza repo).
- `src/Controllers/Storefront/` — kontrolery sklepu (produkty publiczne).
- `src/Controllers/DocsController.php` — serwuje `/docs` (Swagger UI) i `/openapi.json`.
- `src/Models/` — modele Eloquent.
- `src/OpenApi/ApiDefinition.php` — globalne metadane OpenAPI (`#[OA\Info]`, `#[OA\SecurityScheme]`).
