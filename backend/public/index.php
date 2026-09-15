<?php

declare(strict_types=1);

use App\Bootstrap\Database;
use App\Controllers\Admin\AttributeController;
use App\Controllers\Admin\AuthController;
use App\Controllers\Admin\ProductController as AdminProductController;
use App\Controllers\Admin\ProductVariantController;
use App\Controllers\DocsController;
use App\Controllers\Storefront\ProductController as StorefrontProductController;
use App\Database\Migrator;
use App\Database\Seeder;
use App\Middleware\AdminAuthMiddleware;
use App\Support\Jwt;
use Dotenv\Dotenv;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Slim\Routing\RouteCollectorProxy;

require dirname(__DIR__) . '/vendor/autoload.php';

// Część zależności (m.in. brick/math używany wewnątrz castów "decimal" w
// illuminate/database, oraz zircote/swagger-php) nie jest jeszcze w pełni
// zgodna z PHP 8.5 i emituje ostrzeżenia o deprecacji. brick/math zgłasza je
// przez trigger_error(..., E_USER_DEPRECATED) - to INNY bit niż silnikowe
// E_DEPRECATED, więc trzeba wykluczyć oba, inaczej nadal dopisują się do treści
// odpowiedzi JSON i ją psują. To nie są błędy w naszym kodzie.
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

$rootPath = dirname(__DIR__);

// 1. Wczytanie konfiguracji z .env
$dotenv = Dotenv::createImmutable($rootPath);
$dotenv->load();

$appDebug = filter_var($_ENV['APP_DEBUG'] ?? 'false', FILTER_VALIDATE_BOOL);

$databasePath = $_ENV['DB_DATABASE'] ?? 'database/database.sqlite';
if (! str_starts_with($databasePath, '/') && ! preg_match('/^[A-Za-z]:[\\\\\/]/', $databasePath)) {
    $databasePath = $rootPath . '/' . $databasePath;
}

// 2. Połączenie z SQLite przez Eloquent (Capsule)
(new Database($databasePath))->boot();

// 3. Migracje schematu + domyślny superadmin
Migrator::run();
Seeder::run();

// 4. Konfiguracja aplikacji Slim 4
$app = AppFactory::create();
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();
$app->addErrorMiddleware($appDebug, true, true);

$jwt = new Jwt(
    secret: $_ENV['JWT_SECRET'] ?? 'change-this-to-a-random-secret-of-at-least-32-chars',
    ttlSeconds: (int) ($_ENV['JWT_TTL'] ?? 3600),
);

$authController = new AuthController($jwt);
$adminProductController = new AdminProductController();
$attributeController = new AttributeController();
$variantController = new ProductVariantController();
$storefrontProductController = new StorefrontProductController();
$docsController = new DocsController();

// 5. Strona startowa + dokumentacja API (Swagger UI)
$app->get('/', function (Request $request, Response $response): Response {
    $payload = [
        'name' => 'slimCommerce API',
        'status' => 'ok',
        'docs' => '/docs',
        'endpoints' => [
            'POST /api/admin/login',
            'GET|POST /api/admin/products (Bearer JWT)',
            'GET|PUT|DELETE /api/admin/products/{id} (Bearer JWT)',
            'GET|POST /api/admin/attributes (Bearer JWT)',
            'PUT|DELETE /api/admin/attributes/{id} (Bearer JWT)',
            'POST /api/admin/attributes/{id}/values (Bearer JWT)',
            'PUT|DELETE /api/admin/attribute-values/{id} (Bearer JWT)',
            'GET|POST /api/admin/products/{productId}/variants (Bearer JWT)',
            'PUT|DELETE /api/admin/variants/{id} (Bearer JWT)',
            'GET /api/storefront/products',
        ],
    ];

    $response->getBody()->write(json_encode($payload, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT));

    return $response->withHeader('Content-Type', 'application/json');
});

$app->get('/openapi.json', [$docsController, 'openApiJson']);
$app->get('/docs', [$docsController, 'ui']);

// 6. Trasy panelu admina (api/admin) - login publiczny, reszta chroniona JWT
$app->group('/api/admin', function (RouteCollectorProxy $group) use ($authController, $adminProductController, $attributeController, $variantController, $jwt): void {
    $group->post('/login', [$authController, 'login']);

    $group->group('', function (RouteCollectorProxy $group) use ($adminProductController, $attributeController, $variantController): void {
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
    })->add(new AdminAuthMiddleware($jwt));
});

// 7. Trasy sklepu (api/storefront) - publiczne
$app->group('/api/storefront', function (RouteCollectorProxy $group) use ($storefrontProductController): void {
    $group->get('/products', [$storefrontProductController, 'list']);
});

$app->run();
