<?php

declare(strict_types=1);

namespace App\OpenApi;

use OpenApi\Attributes as OA;

/**
 * Nośnik globalnych metadanych dokumentu OpenAPI (info, serwery).
 * Klasa nie jest instancjonowana - służy wyłącznie jako punkt zaczepienia
 * dla atrybutów skanowanych przez zircote/swagger-php.
 */
#[OA\Info(
    version: '1.0.0',
    title: 'slimCommerce API',
    description: 'Headless API e-commerce (Slim 4 + Eloquent/SQLite) z integracją ERP/BaseLinker przez pole external_id. API podzielone jest na api/admin (panel, wymaga JWT) i api/storefront (sklep, publiczne).'
)]
#[OA\Server(url: '/', description: 'Bieżący serwer API')]
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Token zwracany przez POST /api/admin/login'
)]
final class ApiDefinition
{
}
