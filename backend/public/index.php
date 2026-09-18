<?php

declare(strict_types=1);

// Wbudowany serwer PHP (php -S ... public/index.php) kieruje KAŻDE żądanie do
// tego pliku - także po pliki statyczne, np. zdjęcia z public/uploads/.
// `return false` każe mu podać istniejący plik bezpośrednio z dysku.
if (PHP_SAPI === 'cli-server') {
    $requestedPath = urldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
    $requestedFile = realpath(__DIR__ . $requestedPath);

    if ($requestedFile !== false && $requestedFile !== __DIR__ && str_starts_with($requestedFile, __DIR__ . DIRECTORY_SEPARATOR) && is_file($requestedFile)) {
        return false;
    }
}

use App\Bootstrap\Database;
use App\Bootstrap\Logging;
use App\Controllers\Admin\AddressController;
use App\Controllers\Admin\AssetController;
use App\Controllers\Admin\AttributeController;
use App\Controllers\Admin\AuthController;
use App\Controllers\Admin\CartController;
use App\Controllers\Admin\CartItemController;
use App\Controllers\Admin\CategoryController;
use App\Controllers\Admin\ClientController;
use App\Controllers\Admin\DiscountCodeController;
use App\Controllers\Admin\OrderController;
use App\Controllers\Admin\PaymentController;
use App\Controllers\Admin\PaymentMethodController;
use App\Controllers\Admin\ProductController as AdminProductController;
use App\Controllers\Admin\ProductVariantController;
use App\Controllers\Admin\SalesChannelController;
use App\Controllers\Admin\ShippingMethodController;
use App\Controllers\Admin\UserController;
use App\Controllers\DocsController;
use App\Controllers\MaintenanceController;
use App\Controllers\Storefront\AuthController as StorefrontAuthController;
use App\Controllers\Storefront\CartController as StorefrontCartController;
use App\Controllers\Storefront\CategoryController as StorefrontCategoryController;
use App\Controllers\Storefront\CheckoutController as StorefrontCheckoutController;
use App\Controllers\Storefront\PaymentMethodController as StorefrontPaymentMethodController;
use App\Controllers\Storefront\ProductController as StorefrontProductController;
use App\Controllers\Storefront\SettingsController as StorefrontSettingsController;
use App\Controllers\Storefront\ShippingMethodController as StorefrontShippingMethodController;
use App\Database\Installer;
use App\Mail\OrderConfirmationMail;
use App\Middleware\AdminAuthMiddleware;
use App\Middleware\StorefrontAuthMiddleware;
use App\Models\Asset;
use App\Models\SalesChannel;
use App\Support\Jwt;
use App\Support\Mailer;
use Dotenv\Dotenv;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Slim\Routing\RouteCollectorProxy;

require dirname(__DIR__) . '/vendor/autoload.php';

$rootPath = dirname(__DIR__);

// Błędy PHP nigdy nie idą do treści odpowiedzi (psułyby JSON), tylko do pliku
// logu - domyślnie storage/logs/php-error.log, bo na shared hostingu logu
// Apache zwykle nie da się podejrzeć. Ścieżka do nadpisania przez LOG_PATH
// w .env (poniżej, po wczytaniu .env, konfiguracja jest powtarzana).
Logging::configure($rootPath, 'storage/logs/php-error.log');

// 1. Wczytanie konfiguracji z .env
$dotenv = Dotenv::createImmutable($rootPath);
$dotenv->load();

$appDebug = filter_var($_ENV['APP_DEBUG'] ?? 'false', FILTER_VALIDATE_BOOL);

Logging::configure($rootPath, (string) ($_ENV['LOG_PATH'] ?? 'storage/logs/php-error.log'), $appDebug);

// 2. Połączenie z SQLite przez Eloquent (Capsule) - ścieżka, WAL i busy_timeout z .env
Database::fromEnv($rootPath, $_ENV)->boot();

// 3. Migracje schematu + domyślny superadmin.
// DB_AUTO_MIGRATE=true (dev): przy każdym żądaniu, pod blokadą plikową.
// DB_AUTO_MIGRATE=false (produkcja): tylko ręcznie - `php bin/migrate.php`
// albo `POST /api/admin/migrate` z nagłówkiem X-Migrate-Key (MIGRATE_SECRET).
if (filter_var($_ENV['DB_AUTO_MIGRATE'] ?? 'true', FILTER_VALIDATE_BOOL)) {
    Installer::run();
}

// Publiczny adres API - baza dla `url` assetów (zdjęć w public/uploads/).
// APP_URL w .env, a gdy go nie ma - schemat + Host z bieżącego żądania (dev).
$appUrl = rtrim((string) ($_ENV['APP_URL'] ?? ''), '/');
if ($appUrl === '') {
    $scheme = (! empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $appUrl = $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost:8080');
}
Asset::setBaseUrl($appUrl);

// 4. Konfiguracja aplikacji Slim 4
$app = AppFactory::create();
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();
$errorMiddleware = $app->addErrorMiddleware($appDebug, true, true);
// Błędy zawsze jako JSON (a nie HTML "Slim Application Error"), niezależnie od nagłówka Accept.
$errorMiddleware->getDefaultErrorHandler()->forceContentType('application/json');

// CORS - panel admina (backoffice) i sklep (storefront) są osobnymi aplikacjami
// front-endowymi i mogą być serwowane z innych originów niż API. Middleware
// dodany jako ostatni jest wykonywany jako pierwszy (najbardziej zewnętrzna
// warstwa), dzięki czemu przechwytuje żądania OPTIONS (preflight) zanim
// trafią do routingu.
//
// CORS_ALLOWED_ORIGIN to `*` (domyślnie, dev - wszystko dozwolone) albo lista
// originów po przecinku (produkcyjnie, np. `https://admin.example.com`; może
// też być pusta). Do tej listy ZAWSZE dochodzą domeny aktywnych miejsc
// sprzedaży (tabela sales_channels, zarządzana z panelu) - dzięki temu nowy
// storefront pod nową domeną dodaje się w panelu, bez ruszania .env.
// Nagłówek Access-Control-Allow-Origin może nieść tylko jedną wartość, więc
// odbijamy Origin żądania tylko wtedy, gdy jest na liście - w przeciwnym razie
// nagłówka nie ma wcale (przeglądarka zablokuje odpowiedź).
$corsAllowedOrigin = trim((string) ($_ENV['CORS_ALLOWED_ORIGIN'] ?? '*'));
$app->add(function (Request $request, $handler) use ($corsAllowedOrigin): Response {
    if ($request->getMethod() === 'OPTIONS') {
        $response = new \Slim\Psr7\Response();
    } else {
        $response = $handler->handle($request);
    }

    if ($corsAllowedOrigin === '*') {
        $allowOrigin = '*';
    } else {
        $allowedOrigins = array_values(array_filter(array_map('trim', explode(',', $corsAllowedOrigin))));
        $allowedOrigins = array_values(array_unique([...$allowedOrigins, ...SalesChannel::activeOrigins()]));
        $requestOrigin = $request->getHeaderLine('Origin');
        $allowOrigin = in_array($requestOrigin, $allowedOrigins, true) ? $requestOrigin : '';
        $response = $response->withAddedHeader('Vary', 'Origin');
    }

    if ($allowOrigin !== '') {
        $response = $response->withHeader('Access-Control-Allow-Origin', $allowOrigin);
    }

    return $response
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Sales-Channel')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
});

$jwt = new Jwt(
    secret: $_ENV['JWT_SECRET'] ?? 'change-this-to-a-random-secret-of-at-least-32-chars',
    ttlSeconds: (int) ($_ENV['JWT_TTL'] ?? 3600),
);

$mailer = Mailer::fromEnv($_ENV);
$orderConfirmationMail = new OrderConfirmationMail($mailer, trim((string) ($_ENV['APP_NAME'] ?? 'slimCommerce')));
$maintenanceController = new MaintenanceController(trim((string) ($_ENV['MIGRATE_SECRET'] ?? '')));

$authController = new AuthController($jwt);
$adminProductController = new AdminProductController();
$attributeController = new AttributeController();
$variantController = new ProductVariantController();
$categoryController = new CategoryController();
$clientController = new ClientController();
$addressController = new AddressController();
$shippingMethodController = new ShippingMethodController();
$paymentMethodController = new PaymentMethodController();
$orderController = new OrderController();
$paymentController = new PaymentController();
$userController = new UserController();
$cartController = new CartController();
$cartItemController = new CartItemController();
$assetController = new AssetController(__DIR__);
$salesChannelController = new SalesChannelController();
$discountCodeController = new DiscountCodeController();
$storefrontProductController = new StorefrontProductController();
$storefrontCategoryController = new StorefrontCategoryController();
$storefrontCartController = new StorefrontCartController();
$storefrontAuthController = new StorefrontAuthController($jwt);
$storefrontCheckoutController = new StorefrontCheckoutController($jwt, $orderConfirmationMail);
$storefrontShippingMethodController = new StorefrontShippingMethodController();
$storefrontPaymentMethodController = new StorefrontPaymentMethodController();
$storefrontSettingsController = new StorefrontSettingsController();
$docsController = new DocsController();

// 5. Strona startowa + dokumentacja API (Swagger UI)
$app->get('/', function (Request $request, Response $response): Response {
    $payload = [
        'name' => 'slimCommerce API',
        'status' => 'ok',
        'docs' => '/docs',
        'endpoints' => [
            'POST /api/admin/login',
            'POST /api/admin/migrate (X-Migrate-Key)',
            'GET|POST /api/admin/products (Bearer JWT)',
            'GET|PUT|DELETE /api/admin/products/{id} (Bearer JWT)',
            'GET|POST /api/admin/attributes (Bearer JWT)',
            'PUT|DELETE /api/admin/attributes/{id} (Bearer JWT)',
            'POST /api/admin/attributes/{id}/values (Bearer JWT)',
            'PUT|DELETE /api/admin/attribute-values/{id} (Bearer JWT)',
            'GET|POST /api/admin/products/{productId}/variants (Bearer JWT)',
            'PUT|DELETE /api/admin/variants/{id} (Bearer JWT)',
            'GET|POST /api/admin/categories (Bearer JWT)',
            'PUT|DELETE /api/admin/categories/{id} (Bearer JWT)',
            'GET|POST /api/admin/clients (Bearer JWT)',
            'GET|PUT|DELETE /api/admin/clients/{id} (Bearer JWT)',
            'POST /api/admin/clients/{clientId}/addresses (Bearer JWT)',
            'PUT|DELETE /api/admin/addresses/{id} (Bearer JWT)',
            'GET|POST /api/admin/shipping-methods (Bearer JWT)',
            'PUT|DELETE /api/admin/shipping-methods/{id} (Bearer JWT)',
            'GET|POST /api/admin/payment-methods (Bearer JWT)',
            'PUT|DELETE /api/admin/payment-methods/{id} (Bearer JWT)',
            'GET|POST /api/admin/orders (Bearer JWT)',
            'GET|PUT|DELETE /api/admin/orders/{id} (Bearer JWT)',
            'POST /api/admin/orders/{orderId}/payments (Bearer JWT)',
            'DELETE /api/admin/payments/{id} (Bearer JWT)',
            'GET|POST /api/admin/users (Bearer JWT)',
            'PUT|DELETE /api/admin/users/{id} (Bearer JWT)',
            'GET|POST /api/admin/carts (Bearer JWT)',
            'GET|PUT|DELETE /api/admin/carts/{id} (Bearer JWT)',
            'POST /api/admin/carts/{cartId}/items (Bearer JWT)',
            'PUT|DELETE /api/admin/cart-items/{id} (Bearer JWT)',
            'GET|POST /api/admin/assets (Bearer JWT, POST = multipart upload)',
            'GET|PUT|DELETE /api/admin/assets/{id} (Bearer JWT)',
            'GET|POST /api/admin/sales-channels (Bearer JWT)',
            'PUT|DELETE /api/admin/sales-channels/{id} (Bearer JWT)',
            'GET|POST /api/admin/discount-codes (Bearer JWT)',
            'GET|PUT|DELETE /api/admin/discount-codes/{id} (Bearer JWT)',
            'GET /api/storefront/products (?category=slug)',
            'GET /api/storefront/categories',
            'GET /api/storefront/products/{id}',
            'POST /api/storefront/register',
            'POST /api/storefront/login',
            'GET /api/storefront/me (Bearer JWT)',
            'POST /api/storefront/checkout',
            'GET /api/storefront/shipping-methods',
            'GET /api/storefront/payment-methods',
            'GET /api/storefront/settings',
            'POST|DELETE /api/storefront/carts/{token}/discount-code',
            'POST /api/storefront/carts',
            'GET|PUT /api/storefront/carts/{token}',
            'POST /api/storefront/carts/{token}/items',
            'PUT|DELETE /api/storefront/carts/{token}/items/{itemId}',
        ],
    ];

    $response->getBody()->write(json_encode($payload, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT));

    return $response->withHeader('Content-Type', 'application/json');
});

$app->get('/openapi.json', [$docsController, 'openApiJson']);
$app->get('/docs', [$docsController, 'ui']);

// Migracje na żądanie (poza grupą admina: bez JWT, chronione sekretem MIGRATE_SECRET)
$app->post('/api/admin/migrate', [$maintenanceController, 'migrate']);

// 6. Trasy panelu admina (api/admin) - login publiczny, reszta chroniona JWT
$app->group('/api/admin', function (RouteCollectorProxy $group) use (
    $authController,
    $adminProductController,
    $attributeController,
    $variantController,
    $categoryController,
    $clientController,
    $addressController,
    $shippingMethodController,
    $paymentMethodController,
    $orderController,
    $paymentController,
    $userController,
    $cartController,
    $cartItemController,
    $assetController,
    $salesChannelController,
    $discountCodeController,
    $jwt,
): void {
    $group->post('/login', [$authController, 'login']);

    $group->group('', function (RouteCollectorProxy $group) use (
        $adminProductController,
        $attributeController,
        $variantController,
        $categoryController,
        $clientController,
        $addressController,
        $shippingMethodController,
        $paymentMethodController,
        $orderController,
        $paymentController,
        $userController,
        $cartController,
        $cartItemController,
        $assetController,
        $salesChannelController,
        $discountCodeController,
    ): void {
        $group->get('/products', [$adminProductController, 'list']);
        $group->get('/products/{id:[0-9]+}', [$adminProductController, 'show']);
        $group->post('/products', [$adminProductController, 'create']);
        $group->put('/products/{id:[0-9]+}', [$adminProductController, 'update']);
        $group->delete('/products/{id:[0-9]+}', [$adminProductController, 'delete']);

        $group->get('/attributes', [$attributeController, 'list']);
        $group->post('/attributes', [$attributeController, 'create']);
        $group->put('/attributes/{id:[0-9]+}', [$attributeController, 'update']);
        $group->delete('/attributes/{id:[0-9]+}', [$attributeController, 'delete']);
        $group->post('/attributes/{id:[0-9]+}/values', [$attributeController, 'createValue']);
        $group->put('/attribute-values/{id:[0-9]+}', [$attributeController, 'updateValue']);
        $group->delete('/attribute-values/{id:[0-9]+}', [$attributeController, 'deleteValue']);

        $group->get('/products/{productId:[0-9]+}/variants', [$variantController, 'list']);
        $group->post('/products/{productId:[0-9]+}/variants', [$variantController, 'create']);
        $group->put('/variants/{id:[0-9]+}', [$variantController, 'update']);
        $group->delete('/variants/{id:[0-9]+}', [$variantController, 'delete']);

        $group->get('/categories', [$categoryController, 'list']);
        $group->post('/categories', [$categoryController, 'create']);
        $group->put('/categories/{id:[0-9]+}', [$categoryController, 'update']);
        $group->delete('/categories/{id:[0-9]+}', [$categoryController, 'delete']);

        $group->get('/clients', [$clientController, 'list']);
        $group->get('/clients/{id:[0-9]+}', [$clientController, 'show']);
        $group->post('/clients', [$clientController, 'create']);
        $group->put('/clients/{id:[0-9]+}', [$clientController, 'update']);
        $group->delete('/clients/{id:[0-9]+}', [$clientController, 'delete']);
        $group->post('/clients/{clientId:[0-9]+}/addresses', [$addressController, 'create']);
        $group->put('/addresses/{id:[0-9]+}', [$addressController, 'update']);
        $group->delete('/addresses/{id:[0-9]+}', [$addressController, 'delete']);

        $group->get('/shipping-methods', [$shippingMethodController, 'list']);
        $group->post('/shipping-methods', [$shippingMethodController, 'create']);
        $group->put('/shipping-methods/{id:[0-9]+}', [$shippingMethodController, 'update']);
        $group->delete('/shipping-methods/{id:[0-9]+}', [$shippingMethodController, 'delete']);

        $group->get('/payment-methods', [$paymentMethodController, 'list']);
        $group->post('/payment-methods', [$paymentMethodController, 'create']);
        $group->put('/payment-methods/{id:[0-9]+}', [$paymentMethodController, 'update']);
        $group->delete('/payment-methods/{id:[0-9]+}', [$paymentMethodController, 'delete']);

        $group->get('/orders', [$orderController, 'list']);
        $group->get('/orders/{id:[0-9]+}', [$orderController, 'show']);
        $group->post('/orders', [$orderController, 'create']);
        $group->put('/orders/{id:[0-9]+}', [$orderController, 'update']);
        $group->delete('/orders/{id:[0-9]+}', [$orderController, 'delete']);
        $group->post('/orders/{orderId:[0-9]+}/payments', [$paymentController, 'create']);
        $group->delete('/payments/{id:[0-9]+}', [$paymentController, 'delete']);

        $group->get('/users', [$userController, 'list']);
        $group->post('/users', [$userController, 'create']);
        $group->put('/users/{id:[0-9]+}', [$userController, 'update']);
        $group->delete('/users/{id:[0-9]+}', [$userController, 'delete']);

        $group->get('/carts', [$cartController, 'list']);
        $group->get('/carts/{id:[0-9]+}', [$cartController, 'show']);
        $group->post('/carts', [$cartController, 'create']);
        $group->put('/carts/{id:[0-9]+}', [$cartController, 'update']);
        $group->delete('/carts/{id:[0-9]+}', [$cartController, 'delete']);
        $group->post('/carts/{cartId:[0-9]+}/items', [$cartItemController, 'create']);
        $group->put('/cart-items/{id:[0-9]+}', [$cartItemController, 'update']);
        $group->delete('/cart-items/{id:[0-9]+}', [$cartItemController, 'delete']);

        $group->get('/assets', [$assetController, 'list']);
        $group->get('/assets/{id:[0-9]+}', [$assetController, 'show']);
        $group->post('/assets', [$assetController, 'upload']);
        $group->put('/assets/{id:[0-9]+}', [$assetController, 'update']);
        $group->delete('/assets/{id:[0-9]+}', [$assetController, 'delete']);

        $group->get('/sales-channels', [$salesChannelController, 'list']);
        $group->post('/sales-channels', [$salesChannelController, 'create']);
        $group->put('/sales-channels/{id:[0-9]+}', [$salesChannelController, 'update']);
        $group->delete('/sales-channels/{id:[0-9]+}', [$salesChannelController, 'delete']);

        $group->get('/discount-codes', [$discountCodeController, 'list']);
        $group->get('/discount-codes/{id:[0-9]+}', [$discountCodeController, 'show']);
        $group->post('/discount-codes', [$discountCodeController, 'create']);
        $group->put('/discount-codes/{id:[0-9]+}', [$discountCodeController, 'update']);
        $group->delete('/discount-codes/{id:[0-9]+}', [$discountCodeController, 'delete']);
    })->add(new AdminAuthMiddleware($jwt));
});

// 7. Trasy sklepu (api/storefront) - publiczne, poza /me (wymaga tokenu klienta)
$app->group('/api/storefront', function (RouteCollectorProxy $group) use (
    $storefrontProductController,
    $storefrontCategoryController,
    $storefrontCartController,
    $storefrontAuthController,
    $storefrontCheckoutController,
    $storefrontShippingMethodController,
    $storefrontPaymentMethodController,
    $storefrontSettingsController,
    $jwt,
): void {
    $group->get('/products', [$storefrontProductController, 'list']);
    $group->get('/products/{id:[0-9]+}', [$storefrontProductController, 'show']);
    $group->get('/categories', [$storefrontCategoryController, 'list']);

    $group->post('/register', [$storefrontAuthController, 'register']);
    $group->post('/login', [$storefrontAuthController, 'login']);
    $group->get('/me', [$storefrontAuthController, 'me'])->add(new StorefrontAuthMiddleware($jwt));

    $group->post('/checkout', [$storefrontCheckoutController, 'checkout']);
    $group->get('/shipping-methods', [$storefrontShippingMethodController, 'list']);
    $group->get('/payment-methods', [$storefrontPaymentMethodController, 'list']);
    $group->get('/settings', [$storefrontSettingsController, 'show']);

    $group->post('/carts', [$storefrontCartController, 'create']);
    $group->get('/carts/{token}', [$storefrontCartController, 'show']);
    $group->put('/carts/{token}', [$storefrontCartController, 'update']);
    $group->post('/carts/{token}/items', [$storefrontCartController, 'addItem']);
    $group->put('/carts/{token}/items/{itemId:[0-9]+}', [$storefrontCartController, 'updateItem']);
    $group->delete('/carts/{token}/items/{itemId:[0-9]+}', [$storefrontCartController, 'removeItem']);
    $group->post('/carts/{token}/discount-code', [$storefrontCartController, 'applyDiscountCode']);
    $group->delete('/carts/{token}/discount-code', [$storefrontCartController, 'removeDiscountCode']);
});

$app->run();
