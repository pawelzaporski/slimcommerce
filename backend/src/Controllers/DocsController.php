<?php

declare(strict_types=1);

namespace App\Controllers;

use OpenApi\Generator;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Serwuje na żywo specyfikację OpenAPI (wygenerowaną z atrybutów PHP)
 * oraz prostą stronę ze Swagger UI, bez potrzeby osobnego kroku budowania.
 */
final class DocsController
{
    private const SCAN_PATHS = [
        __DIR__,
        __DIR__ . '/../Models',
        __DIR__ . '/../OpenApi',
    ];

    public function openApiJson(Request $request, Response $response): Response
    {
        $openapi = Generator::scan(self::SCAN_PATHS);

        $response->getBody()->write($openapi->toJson());

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function ui(Request $request, Response $response): Response
    {
        $html = <<<'HTML'
        <!doctype html>
        <html lang="pl">
        <head>
            <meta charset="utf-8">
            <title>slimCommerce API — dokumentacja</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
        </head>
        <body>
            <div id="swagger-ui"></div>
            <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
            <script>
                window.onload = () => {
                    window.ui = SwaggerUIBundle({
                        url: '/openapi.json',
                        dom_id: '#swagger-ui',
                    });
                };
            </script>
        </body>
        </html>
        HTML;

        $response->getBody()->write($html);

        return $response->withHeader('Content-Type', 'text/html');
    }
}
